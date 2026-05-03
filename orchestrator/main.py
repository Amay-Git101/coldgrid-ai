import asyncio
import json
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from orchestrator import Orchestrator, COLD_STORES
from constants import ROADS
import traceback
from dotenv import load_dotenv

load_dotenv()

orchestrator = None
connected_clients = set()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global orchestrator
    orchestrator = Orchestrator()
    await orchestrator.initialize()
    asyncio.create_task(background_loop())
    yield
    if orchestrator:
        await orchestrator.stop()

app = FastAPI(lifespan=lifespan)

# Read allowed origins from env (comma-separated) or allow all for local dev
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Helper to build a full state snapshot (used by WebSocket connect and /api/state)
def get_current_state():
    if orchestrator is None:
        return None
    disruptions = {}
    for cs_id, agent in orchestrator.cold_store_agents.items():
        meta = agent.metadata
        if meta.get("demand_spike") or meta.get("cold_chain_failed"):
            disruptions[cs_id] = {
                "demand_spike": meta.get("demand_spike"),
                "cold_chain_failed": meta.get("cold_chain_failed", False)
            }
    return {
        "type": "CYCLE_UPDATE",
        "cold_stores": orchestrator.cold_store_stocks,
        "hq_stocks": orchestrator.hq_stocks,
        "hq_trucks": orchestrator.hq_trucks,          # <-- truck counts now exposed
        "deliveries": [d for d in orchestrator.transport_agent.active_deliveries if d],
        "blocked_roads": list(orchestrator.graph.blocked_roads),
        "disruptions_active": disruptions,             # <-- active spikes/failures
        "decisions": []                                # will be filled by next cycle
    }

async def broadcast(message: str):
    for client in list(connected_clients):
        try:
            await client.send_text(message)
        except Exception:
            connected_clients.remove(client)

async def background_loop():
    global recent_decisions
    recent_decisions = []
    while orchestrator and orchestrator.running:
        try:
            await orchestrator.run_cycle()
            if orchestrator.db is not None:
                cursor = orchestrator.db["agent_decisions"].find(
                    {}, {"_id": 0}
                ).sort("timestamp", -1).limit(60)
                recent_decisions = await cursor.to_list(length=60)

            # Build disruptions state
            disruptions = {}
            for cs_id, agent in orchestrator.cold_store_agents.items():
                meta = agent.metadata
                if meta.get("demand_spike") or meta.get("cold_chain_failed"):
                    disruptions[cs_id] = {
                        "demand_spike": meta.get("demand_spike"),
                        "cold_chain_failed": meta.get("cold_chain_failed", False)
                    }

            payload = {
                "type": "CYCLE_UPDATE",
                "cold_stores": orchestrator.cold_store_stocks,
                "hq_stocks": orchestrator.hq_stocks,
                "hq_trucks": orchestrator.hq_trucks,
                "deliveries": [d for d in orchestrator.transport_agent.active_deliveries if d],
                "blocked_roads": list(orchestrator.graph.blocked_roads),
                "disruptions_active": disruptions,
                "decisions": recent_decisions
            }
            await broadcast(json.dumps(payload, default=str))
        except Exception as e:
            print(f"Error in loop: {e}\n{traceback.format_exc()}")
        await asyncio.sleep(5)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    # Push immediate state snapshot so the frontend never sees a blank screen
    state = get_current_state()
    if state:
        await websocket.send_text(json.dumps(state, default=str))
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        connected_clients.remove(websocket)

# ---------- JUDGE ENDPOINTS ----------
@app.post("/judge/block-road")
async def block_road(node1: str, node2: str, route_name: str):
    orchestrator.graph.block_road(node1, node2, route_name)
    for i, delv in enumerate(orchestrator.transport_agent.active_deliveries):
        if delv and delv["route"]:
            for seg in delv["route"]:
                if (seg["from"] == node1 and seg["to"] == node2) or \
                   (seg["from"] == node2 and seg["to"] == node1):
                    if seg["route_name"] == route_name:
                        await orchestrator.transport_agent.reroute_delivery(i, {})
    return {"status": "blocked"}

@app.post("/judge/unblock-road")
async def unblock_road(node1: str, node2: str, route_name: str):
    orchestrator.graph.unblock_road(node1, node2, route_name)
    return {"status": "unblocked"}

@app.post("/judge/drain-stock")
async def drain_stock(cs_id: str, product: str):
    if cs_id in orchestrator.cold_store_stocks:
        orchestrator.cold_store_stocks[cs_id][product] = 0
        return {"status": "drained"}
    return {"error": "cold store not found"}

@app.post("/judge/flood-stock")
async def flood_stock(cs_id: str, product: str, amount: float):
    if cs_id in orchestrator.cold_store_stocks:
        orchestrator.cold_store_stocks[cs_id][product] += amount
        return {"status": "flooded"}
    return {"error": "cold store not found"}

@app.post("/judge/spike-demand")
async def spike_demand(cs_id: str, multiplier: float = 5.0):
    if cs_id in orchestrator.cold_store_agents:
        orchestrator.cold_store_agents[cs_id].metadata["demand_spike"] = multiplier
        async def reset():
            await asyncio.sleep(90)
            orchestrator.cold_store_agents[cs_id].metadata.pop("demand_spike", None)
        asyncio.create_task(reset())
        return {"status": "spiked", "expires_in_seconds": 90}
    return {"error": "cold store not found"}

@app.post("/judge/cold-chain-failure")
async def cold_chain_failure(cs_id: str):
    if cs_id in orchestrator.cold_store_agents:
        orchestrator.cold_store_agents[cs_id].metadata["cold_chain_failed"] = True
        # Wipe perishable stocks to simulate the failure consequence
        perishables = ["dairy", "meat", "seafood", "ice_cream", "medicine", "frozen_meals"]
        for p in perishables:
            if p in orchestrator.cold_store_stocks.get(cs_id, {}):
                orchestrator.cold_store_stocks[cs_id][p] = 0
        return {"status": "failure_activated"}
    return {"error": "cold store not found"}

@app.post("/judge/restore-cold-chain")
async def restore_cold_chain(cs_id: str):
    if cs_id in orchestrator.cold_store_agents:
        orchestrator.cold_store_agents[cs_id].metadata.pop("cold_chain_failed", None)
        # Partially restore perishables to recovery level
        perishables = ["dairy", "meat", "seafood", "ice_cream", "medicine", "frozen_meals"]
        for p in perishables:
            if p in orchestrator.cold_store_stocks.get(cs_id, {}):
                orchestrator.cold_store_stocks[cs_id][p] = max(
                    orchestrator.cold_store_stocks[cs_id][p], 20
                )
        return {"status": "cold_chain_restored"}
    return {"error": "cold store not found"}

# ---------- DATA ENDPOINTS ----------
@app.get("/api/roads")
async def get_roads():
    return {"roads": ROADS}

@app.get("/api/state")
async def get_state():
    state = get_current_state()
    if state is None:
        return {"error": "Orchestrator not initialized"}
    return state

@app.get("/api/health")
async def health():
    return {"status": "ok", "agents": len(orchestrator.cold_store_agents) if orchestrator else 0}
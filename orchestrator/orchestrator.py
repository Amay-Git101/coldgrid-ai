import random
import asyncio
import uuid
from datetime import datetime
from constants import HEADQUARTERS, COLD_STORES, PRODUCTS, ROADS, CITY_DEMAND_PROFILES
from agents.inventory_agent import InventoryAgent
from agents.demand_forecast_agent import DemandForecastAgent
from agents.supplier_agent import SupplierAgent
from agents.alert_agent import AlertAgent
from agents.transportation_agent import TransportationAgent
from agents.lateral_transfer_agent import LateralTransferAgent
from transport_graph import TransportGraph
import database

class Orchestrator:
    def __init__(self):
        self.hq_stocks = {}
        self.cold_store_stocks = {}
        self.hq_trucks = {}
        self.cold_store_agents = {}
        self.supply_agents = {}
        self.demand_agents = {}
        self.graph = TransportGraph()
        self._build_road_network()
        self.transport_agent = TransportationAgent(self.graph)
        self.lateral_agent = None
        self.alert_agent = AlertAgent()
        self.db = None
        self.running = False

    def _build_road_network(self):
        for road in ROADS:
            frm = road["from"]
            to = road["to"]
            route_name = road["route_name"]
            weight = road["time"]
            self.graph.add_edge(frm, to, route_name, weight,
                                risk=road["risk"], distance=road["distance"])
        print(f"Road network built: {len(ROADS)} edges")

    async def initialize(self):
        await database.connect_db()
        self.db = database.db
        if self.db is None:
            raise RuntimeError("Database connection failed")
        for hq_id, info in HEADQUARTERS.items():
            self.hq_stocks[hq_id] = {p: int(200 * info["stock_mult"]) for p in PRODUCTS}
            self.hq_trucks[hq_id] = {"available": info["trucks"], "total": info["trucks"]}
        for cs in COLD_STORES:
            cs_id = cs["id"]
            self.cold_store_stocks[cs_id] = {p: random.randint(10, 60) for p in PRODUCTS}
            self.cold_store_agents[cs_id] = InventoryAgent(cs_id, cs["name"], cs["state"], cs["primary_hq"])
            if cs["state"] not in self.demand_agents:
                self.demand_agents[cs["state"]] = DemandForecastAgent(cs["state"])
        for hq_id in HEADQUARTERS:
            self.supply_agents[hq_id] = SupplierAgent(hq_id, HEADQUARTERS[hq_id]["state"])
        self.lateral_agent = LateralTransferAgent(self.cold_store_stocks, self.transport_agent)
        self.alert_agent = AlertAgent()
        print(f"Initialized {len(self.cold_store_agents)} cold stores, {len(self.supply_agents)} HQs")
        self.running = True

    async def run_cycle(self):
        if self.db is None or not self.running:
            return

        # 1. Deplete stocks with city‑specific profiles
        for cs_id, agent in self.cold_store_agents.items():
            hour = datetime.utcnow().hour
            demand_factor = 1.0 + 0.5 * (hour / 24)
            city_mult = CITY_DEMAND_PROFILES.get(cs_id, {})
            for product, rate in PRODUCTS.items():
                depletion = rate * demand_factor * city_mult.get(product, 1.0)
                metadata = getattr(agent, "metadata", {})
                if metadata.get("cold_chain_failed"):
                    depletion *= 3
                if metadata.get("demand_spike"):
                    depletion *= metadata["demand_spike"]
                cur = self.cold_store_stocks[cs_id].get(product, 0)
                if cur > 0:
                    self.cold_store_stocks[cs_id][product] = max(0, cur - depletion)

        # 2. Run demand forecast agents and log their alerts
        demand_signals_by_state = {}
        for state, dem_agent in self.demand_agents.items():
            perception = await dem_agent.perceive(self.db)
            active_events = []  # not using engine for now
            signals = await dem_agent.reason(perception, active_events)
            demand_signals_by_state[state] = signals
            # Log demand forecast decisions
            await dem_agent.act(signals, self.db)

        # 3. Inventory checks → building restock requests
        restock_requests = []
        for cs_id, agent in self.cold_store_agents.items():
            cs_state = next(cs["state"] for cs in COLD_STORES if cs["id"] == cs_id)
            signals = demand_signals_by_state.get(cs_state, {})
            for product, level in self.cold_store_stocks[cs_id].items():
                decision = await agent.reason(product, level, signals, [])
                if decision["action"] == "REQUEST_RESTOCK":
                    decision["warehouse_id"] = cs_id
                    decision["product"] = product
                    restock_requests.append(decision)

                    decision_doc = {
                        "agent_id": agent.agent_id,
                        "agent_type": "inventory",
                        "warehouse_id": cs_id,
                        "timestamp": datetime.utcnow(),
                        "decision": "REQUEST_RESTOCK",
                        "decision_payload": {
                            "product": product,
                            "quantity_tons": decision["quantity_tons"],
                            "urgency": decision["urgency"]
                        },
                        "reasoning": decision["reasoning"],
                        "confidence_score": decision["confidence_score"],
                        "rl_reward": None,
                        "outcome": "pending"
                    }
                    await self.db["agent_decisions"].insert_one(decision_doc)

        # 4. Process restock requests
        for req in restock_requests:
            cs_id = req["warehouse_id"]
            product = req["product"]
            cs_info = next(cs for cs in COLD_STORES if cs["id"] == cs_id)
            primary_hq = cs_info["primary_hq"]
            hq_stock = self.hq_stocks[primary_hq].get(product, 0)
            trucks = self.hq_trucks[primary_hq]["available"]
            if hq_stock >= req["quantity_tons"] and trucks > 0:
                result = await self.transport_agent.dispatch_vehicle(
                    primary_hq, cs_id, product, req["quantity_tons"], req.get("urgency", 1)
                )
                if result["status"] == "dispatched":
                    self.hq_stocks[primary_hq][product] -= req["quantity_tons"]
                    self.hq_trucks[primary_hq]["available"] -= 1
                    sup_agent = self.supply_agents[primary_hq]
                    decision_doc = {
                        "agent_id": sup_agent.agent_id,
                        "agent_type": "supplier",
                        "cs_id": cs_id,
                        "warehouse_id": cs_id,
                        "timestamp": datetime.utcnow(),
                        "decision": "DISPATCH_VEHICLE",
                        "action": f"Dispatched from {primary_hq} to {cs_id}",
                        "decision_payload": result,
                        "reasoning": f"Dispatched from {primary_hq} to {cs_id} via {result['delivery']['route'][0]['route_name']}",
                        "confidence_score": 0.9,
                        "rl_reward": None,
                        "outcome": "pending"
                    }
                    await self.db["agent_decisions"].insert_one(decision_doc)
                else:
                    chain_id = str(uuid.uuid4())
                    lateral_success = await self._handle_lateral_transfer(req, chain_id=chain_id)
                    if not lateral_success:
                        await self._escalate_failed_restock(cs_id, product, result.get("reason", "No route"), chain_id=chain_id)
            else:
                chain_id = str(uuid.uuid4())
                lateral_success = await self._handle_lateral_transfer(req, chain_id=chain_id)
                if not lateral_success:
                    await self._escalate_failed_restock(cs_id, product, "HQ stock/trucks unavailable", chain_id=chain_id)

        # 5. Advance deliveries
        await self.transport_agent.tick(1.0)

        # 6. Handle arrivals
        to_remove = []
        for i, delivery in enumerate(self.transport_agent.active_deliveries):
            if delivery and delivery["status"] == "arrived":
                to_id = delivery["to"]
                if to_id in self.cold_store_stocks:
                    self.cold_store_stocks[to_id][delivery["product"]] += delivery["quantity"]
                if delivery["from"] in self.hq_trucks:
                    self.hq_trucks[delivery["from"]]["available"] += 1
                decision_doc = {
                    "agent_id": "TRANSPORTATION",
                    "agent_type": "transportation",
                    "cs_id": to_id,
                    "warehouse_id": to_id,
                    "timestamp": datetime.utcnow(),
                    "decision": "DELIVERY_ARRIVED",
                    "action": f"Delivery of {delivery['product']} arrived from {delivery['from']}",
                    "decision_payload": delivery,
                    "reasoning": f"Delivery of {delivery['quantity']} {delivery['product']} arrived from {delivery['from']}",
                    "confidence_score": 1.0,
                    "rl_reward": None,
                    "outcome": "success"
                }
                await self.db["agent_decisions"].insert_one(decision_doc)
                to_remove.append(i)
        for i in sorted(to_remove, reverse=True):
            del self.transport_agent.active_deliveries[i]

        # 7. Run alert agent for critical failures
        # (it already watches all decisions; we just let it run at the end)
        await self.alert_agent.evaluate([], [], self.db)

        # 8. Replenish HQs occasionally
        if random.randint(1, 10) == 1:
            for hq_id in HEADQUARTERS:
                for product in PRODUCTS:
                    self.hq_stocks[hq_id][product] += random.randint(150, 250)

    async def _handle_lateral_transfer(self, req, chain_id: str = None):
        cs_id = req["warehouse_id"]
        product = req["product"]
        primary_hq = next((cs["primary_hq"] for cs in COLD_STORES if cs["id"] == cs_id), "unknown")
        best_route = None
        best_source = None
        for other_id, stocks in self.cold_store_stocks.items():
            if other_id == cs_id:
                continue
            if stocks.get(product, 0) > 50:
                route = self.graph.get_best_route(other_id, cs_id)
                if route and (best_route is None or len(route) < len(best_route)):
                    best_route = route
                    best_source = other_id
        if best_route and best_source:
            # Step 1 of chain: TRANSPORT blocked
            if chain_id:
                await self.db["agent_decisions"].insert_one({
                    "agent_id": "TRANSPORTATION", "agent_type": "transportation",
                    "cs_id": cs_id, "warehouse_id": cs_id,
                    "timestamp": datetime.utcnow(),
                    "decision": "NO_DIRECT_ROUTE",
                    "action": f"All direct routes to {cs_id} blocked or unavailable",
                    "reasoning": f"{cs_id}: No viable route from {primary_hq}. Escalating to Supply Agent.",
                    "escalation_chain_id": chain_id, "escalation_step": 1,
                    "confidence_score": 1.0, "rl_reward": None, "outcome": "escalated"
                })
                # Step 2: SUPPLY escalates
                await self.db["agent_decisions"].insert_one({
                    "agent_id": f"SUPPLY_{primary_hq}", "agent_type": "supplier",
                    "cs_id": cs_id, "warehouse_id": cs_id,
                    "timestamp": datetime.utcnow(),
                    "decision": "CANNOT_DISPATCH",
                    "action": f"HQ {primary_hq} cannot dispatch to {cs_id}",
                    "reasoning": f"Cannot dispatch. All routes to {cs_id} unavailable or fleet exhausted. Requesting lateral transfer assessment.",
                    "escalation_chain_id": chain_id, "escalation_step": 2,
                    "confidence_score": 0.95, "rl_reward": None, "outcome": "escalated"
                })
                # Step 3: LATERAL scans
                surplus = self.cold_store_stocks.get(best_source, {}).get(product, 0)
                await self.db["agent_decisions"].insert_one({
                    "agent_id": "LATERAL_TRANSFER", "agent_type": "lateral_transfer",
                    "cs_id": cs_id, "warehouse_id": cs_id,
                    "timestamp": datetime.utcnow(),
                    "decision": "LATERAL_SCAN",
                    "action": f"Scanning network for {product} surplus",
                    "reasoning": f"Scanning network. {best_source} surplus: {product} +{int(surplus-50)} above threshold. Distance {best_source}→{cs_id}: viable. Authorizing emergency CS→CS transfer.",
                    "escalation_chain_id": chain_id, "escalation_step": 3,
                    "confidence_score": 0.87, "rl_reward": None, "outcome": "resolving"
                })

            result = await self.lateral_agent.request_transfer(
                best_source, cs_id, product, req["quantity_tons"]
            )
            if result.get("status") == "failed":
                return False

            # Step 4: Resolved
            await self.db["agent_decisions"].insert_one({
                "agent_id": "LATERAL_TRANSFER", "agent_type": "lateral_transfer",
                "cs_id": cs_id, "warehouse_id": cs_id,
                "timestamp": datetime.utcnow(),
                "decision": "CS_TO_CS_TRANSFER",
                "action": f"CS→CS vehicle dispatched: {best_source} → {cs_id}",
                "reasoning": f"CS→CS vehicle en route. {best_source} → {cs_id}. Bypassing all blocked HQ corridors entirely.",
                "escalation_chain_id": chain_id,
                "escalation_step": 4,
                "confidence_score": 0.85, "rl_reward": None, "outcome": "pending"
            })
            return True
        return False

    async def _escalate_failed_restock(self, cs_id: str, product: str, reason: str, chain_id: str = None):
        alert_doc = {
            "agent_id": self.alert_agent.agent_id,
            "agent_type": "alert",
            "cs_id": cs_id,
            "warehouse_id": cs_id,
            "timestamp": datetime.utcnow(),
            "decision": "ESCALATE_RESTOCK_FAILURE",
            "action": f"Restock failure for {product} at {cs_id}",
            "decision_payload": {"product": product, "reason": reason},
            "reasoning": f"Restock for {product} at {cs_id} failed: {reason}. Manual intervention may be needed.",
            "escalation_chain_id": chain_id,
            "confidence_score": 1.0,
            "rl_reward": None,
            "outcome": "pending"
        }
        await self.db["agent_decisions"].insert_one(alert_doc)

    async def stop(self):
        self.running = False
        await database.close_db()
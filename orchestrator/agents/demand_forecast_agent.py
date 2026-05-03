import random
from datetime import datetime
from constants import PRODUCTS

class DemandForecastAgent:
    def __init__(self, state: str):
        self.agent_id = f"DEMAND_AGENT_{state}"
        self.state = state

    async def perceive(self, db):
        return {"state": self.state}

    async def reason(self, perception, active_events):
        demand_signals = {}
        for product in PRODUCTS.keys():
            base = 1.0
            for evt in active_events:
                if self.state in evt.get("affected_states", []):
                    if evt["type"] in ["festival_demand_spike", "heatwave"]:
                        base += random.uniform(0.5, 1.5)
                    elif evt["type"] == "power_outage":
                        base += 0.2
            demand_signals[product] = round(base, 2)
        return demand_signals

    async def act(self, demand_signals, db):
        for product, value in demand_signals.items():
            if value > 1.5:
                decision_doc = {
                    "agent_id": self.agent_id,
                    "agent_type": "demand_forecast",
                    "warehouse_id": None,
                    "timestamp": datetime.utcnow(),
                    "trigger_event": "",
                    "decision": "RAISE_DEMAND_ALERT",
                    "decision_payload": {
                        "product": product,
                        "demand_index": value,
                        "state": self.state
                    },
                    "reasoning": f"Demand index for {product} in {self.state} is {value:.2f} – alerting inventory agents.",
                    "confidence_score": round(random.uniform(0.8, 0.98), 2),
                    "rl_reward": None,
                    "outcome": "pending"
                }
                await db["agent_decisions"].insert_one(decision_doc)
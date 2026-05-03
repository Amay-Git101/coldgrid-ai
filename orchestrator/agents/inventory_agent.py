import random

class InventoryAgent:
    def __init__(self, warehouse_id: str, city: str, state: str, primary_hq: str):
        self.agent_id = f"INV_{warehouse_id}"
        self.warehouse_id = warehouse_id
        self.city = city
        self.state = state
        self.primary_hq = primary_hq
        self.metadata = {}

    async def reason(self, product: str, stock_level: float, demand_signals: dict, active_events: list):
        min_threshold = 40
        max_threshold = 70
        demand_factor = demand_signals.get(product, 1.0)
        effective_min = min_threshold * demand_factor
        decision = {
            "action": "hold",
            "quantity_tons": 0,
            "urgency": "normal",
            "reasoning": "",
            "confidence_score": 1.0
        }
        if stock_level < effective_min:
            quantity = random.randint(20, 40)
            urgency = "high" if stock_level < 15 else "normal"
            decision["action"] = "REQUEST_RESTOCK"
            decision["quantity_tons"] = quantity
            decision["urgency"] = urgency
            decision["reasoning"] = f"Stock {stock_level:.1f} below threshold {effective_min:.1f} (demand factor {demand_factor:.2f})"
            decision["confidence_score"] = 0.85
        elif stock_level > max_threshold:
            decision["action"] = "DUMP_SURPLUS"
            decision["quantity_tons"] = stock_level - max_threshold
            decision["reasoning"] = f"Overstock at {stock_level:.1f}"
        return decision

    async def act(self, decisions, db):
        pass
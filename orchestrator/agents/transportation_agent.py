import uuid
from datetime import datetime
from transport_graph import TransportGraph

class TransportationAgent:
    def __init__(self, graph: TransportGraph):
        self.graph = graph
        self.active_deliveries = []

    async def dispatch_vehicle(self, from_node: str, to_node: str, product: str, quantity: float, urgency: int):
        route = self.graph.get_best_route(from_node, to_node)
        if not route:
            return {"status": "failed", "reason": "No unblocked route"}
        # Normalise urgency to string label for frontend consumption
        urgency_map = {1: "normal", 2: "important", 3: "critical"}
        urgency_label = urgency_map.get(urgency, "normal") if isinstance(urgency, int) else urgency
        delivery = {
            "id": str(uuid.uuid4()),               # <-- unique id for each delivery
            "from": from_node,
            "to": to_node,
            "product": product,
            "quantity": quantity,
            "route": route,
            "current_step": 0,
            "progress": 0.0,                       # <-- progress 0 to 1
            "arrival_time": None,
            "start_time": datetime.utcnow(),
            "urgency": urgency_label,
            "status": "on_road"
        }
        self.active_deliveries.append(delivery)
        return {"status": "dispatched", "delivery": delivery}

    async def reroute_delivery(self, delivery_index, blockage_info):
        if delivery_index >= len(self.active_deliveries) or not self.active_deliveries[delivery_index]:
            return False
        delivery = self.active_deliveries[delivery_index]
        current_node = delivery["route"][delivery["current_step"]]["from"]
        new_route = self.graph.get_best_route(current_node, delivery["to"])
        if not new_route:
            delivery["status"] = "stalled"
            return False
        delivery["route"] = new_route
        delivery["current_step"] = 0
        delivery["progress"] = 0.0
        return True

    async def tick(self, time_delta: float):
        for delv in self.active_deliveries:
            if delv["status"] != "on_road":
                continue
            delv["current_step"] += 1
            # Compute progress as fraction of completed segments
            delv["progress"] = min(1.0, delv["current_step"] / len(delv["route"]))
            if delv["current_step"] >= len(delv["route"]):
                delv["status"] = "arrived"
                delv["arrival_time"] = datetime.utcnow()
                delv["progress"] = 1.0
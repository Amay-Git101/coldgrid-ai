class SupplierAgent:
    def __init__(self, hq_id: str, state: str):
        self.agent_id = f"SUP_{hq_id}"
        self.hq_id = hq_id
        self.state = state

    async def handle_restock_request(self, request, db):
        pass
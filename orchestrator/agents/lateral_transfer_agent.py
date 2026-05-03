class LateralTransferAgent:
    def __init__(self, cold_store_stocks, transport_agent):
        self.cold_store_stocks = cold_store_stocks
        self.transport = transport_agent

    async def request_transfer(self, from_cs_id: str, to_cs_id: str, product: str, quantity: float):
        from_stock = self.cold_store_stocks[from_cs_id]
        if from_stock[product] < quantity:
            return {"status": "failed", "reason": "insufficient surplus"}
        from_stock[product] -= quantity
        result = await self.transport.dispatch_vehicle(from_cs_id, to_cs_id, product, quantity, urgency=3)
        return result
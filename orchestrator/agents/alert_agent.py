from datetime import datetime

class AlertAgent:
    def __init__(self):
        self.agent_id = "ALERT_AGENT_GLOBAL"

    async def evaluate(self, decisions, events, db):
        criticals = []
        for dec in decisions:
            if dec.get("outcome") == "failed":
                criticals.append(dec)
        if criticals or any(e["severity"] == "critical" for e in events):
            alert = {
                "agent_id": self.agent_id,
                "agent_type": "alert",
                "warehouse_id": None,
                "timestamp": datetime.utcnow(),
                "trigger_event": "",
                "decision": "TRIGGER_EMERGENCY",
                "decision_payload": {},
                "reasoning": "Critical event or multiple agent failures detected.",
                "confidence_score": 1.0,
                "rl_reward": None,
                "outcome": "pending"
            }
            await db["agent_decisions"].insert_one(alert)
            return [alert]
        return []
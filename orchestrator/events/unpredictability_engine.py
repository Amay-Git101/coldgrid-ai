import random
from datetime import datetime

EVENT_TEMPLATES = [
    {
        "type": "cyclone_warning",
        "severity": "critical",
        "affected_states": ["Gujarat", "Maharashtra", "Odisha"],
        "effects": {
            "transport_delay_hours": lambda: random.randint(12, 72),
            "demand_spike_categories": ["packaged_food", "water"],
            "supplier_availability_drop": 0.6
        }
    },
    {
        "type": "festival_demand_spike",
        "severity": "medium",
        "affected_states": lambda: random.sample(
            ["Gujarat", "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "West Bengal", "Rajasthan", "Telangana"],
            random.randint(1, 3)
        ),
        "effects": {
            "demand_index_multiplier": lambda: random.uniform(1.5, 3.0),
            "categories": ["dairy", "sweets", "beverages"]
        }
    },
    {
        "type": "power_outage",
        "severity": "high",
        "affected_warehouses": lambda: [f"WH_{random.choice(['GJ','MH','KA']).upper()}_{random.randint(1,3):03d}"],
        "effects": {
            "temperature_breach_risk": 0.8,
            "stock_spoilage_risk": 0.4
        }
    },
    {
        "type": "supplier_bankruptcy",
        "severity": "high",
        "affected_states": lambda: random.sample(
            ["Gujarat", "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "West Bengal", "Rajasthan", "Telangana"],
            random.randint(1, 2)
        ),
        "effects": {
            "supplier_removed_from_pool": True,
            "restock_delay_days": lambda: random.randint(3, 10)
        }
    },
    {
        "type": "heatwave",
        "severity": "medium",
        "affected_states": ["Rajasthan", "Gujarat"],
        "effects": {
            "demand_spike_categories": ["ice_cream", "beverages", "dairy"],
            "temperature_zone_stress": "frozen"
        }
    }
]

class UnpredictabilityEngine:
    def __init__(self, db):
        self.db = db

    async def generate_event(self):
        template = random.choice(EVENT_TEMPLATES)
        event_id = f"EVT_{datetime.utcnow().timestamp()}"
        affected_states = template.get("affected_states", [])
        if callable(affected_states):
            affected_states = affected_states()
        affected_warehouses = template.get("affected_warehouses", [])
        if callable(affected_warehouses):
            affected_warehouses = affected_warehouses()

        event_doc = {
            "event_id": event_id,
            "type": template["type"],
            "severity": template["severity"],
            "affected_states": affected_states,
            "affected_warehouses": affected_warehouses,
            "description": self._build_description(template),
            "effects": self._resolve_effects(template.get("effects", {})),
            "status": "active",
            "created_at": datetime.utcnow(),
            "duration_hours": random.randint(6, 48) if template["severity"] != "critical" else random.randint(24, 96)
        }
        await self.db["unpredictable_events"].insert_one(event_doc)
        return event_doc

    def _build_description(self, template):
        desc_map = {
            "cyclone_warning": "Cyclone warning – transport disrupted",
            "festival_demand_spike": "Major festival demand spike",
            "power_outage": "Power outage – cold storage at risk",
            "supplier_bankruptcy": "Supplier bankruptcy – alternate sourcing required",
            "heatwave": "Severe heatwave – cold storage demand spike"
        }
        return desc_map.get(template["type"], "Unknown event")

    def _resolve_effects(self, effects_template):
        resolved = {}
        for key, value in effects_template.items():
            if callable(value):
                resolved[key] = value()
            else:
                resolved[key] = value
        return resolved

    async def resolve_event(self, event_id):
        await self.db["unpredictable_events"].update_one(
            {"event_id": event_id},
            {"$set": {"status": "resolved", "resolved_at": datetime.utcnow()}}
        )
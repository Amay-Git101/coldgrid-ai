import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

client = None
db = None

async def connect_db():
    global client, db
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "coldgrid")
    client = AsyncIOMotorClient(mongodb_url)
    db = client[db_name]
    print(f"Connected to MongoDB: {db_name}")

async def close_db():
    global client
    if client:
        client.close()

async def insert_decision(decision: dict):
    await db["agent_decisions"].insert_one(decision)

async def insert_event(event: dict):
    await db["unpredictable_events"].insert_one(event)

async def get_active_events():
    cursor = db["unpredictable_events"].find({"status": "active"})
    return await cursor.to_list(length=100)

async def update_event_status(event_id: str, status: str):
    await db["unpredictable_events"].update_one(
        {"event_id": event_id},
        {"$set": {"status": status}}
    )
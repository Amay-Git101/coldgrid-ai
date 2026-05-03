import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';
import axios from 'axios';   // <-- new dependency

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const MONGO_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DATABASE_NAME || 'coldgrid';
let db: Db;

let lastDecisionTimestamp = new Date(0);
let lastEventTimestamp = new Date(0);

async function pollChanges() {
  if (!db) return;

  // Poll for new decisions
  const decisions = await db.collection('agent_decisions')
    .find({ timestamp: { $gt: lastDecisionTimestamp } })
    .sort({ timestamp: 1 })
    .toArray();

  decisions.forEach((doc: any) => {
    io.emit('agent.decision', doc);
    if (doc.timestamp > lastDecisionTimestamp) {
      lastDecisionTimestamp = doc.timestamp;
    }
  });

  // Poll for new events
  const events = await db.collection('unpredictable_events')
    .find({ created_at: { $gt: lastEventTimestamp } })
    .sort({ created_at: 1 })
    .toArray();

  events.forEach((doc: any) => {
    io.emit('event.triggered', doc);
    if (doc.created_at > lastEventTimestamp) {
      lastEventTimestamp = doc.created_at;
    }
  });
}

// Fetch warehouse state from orchestrator and broadcast to frontend
async function broadcastWarehouseState() {
  try {
    const response = await axios.get('http://localhost:8000/api/warehouses');
    io.emit('cycle.update', response.data);
  } catch (err) {
    console.error('Failed to fetch warehouse state from orchestrator:', err);
  }
}

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`Connected to MongoDB: ${DB_NAME}`);

  // REST endpoints
  app.get('/api/warehouses', async (req: Request, res: Response) => {
    // This could also fetch from the orchestrator, but we keep a simple local mirror? 
    // We'll just return empty for now; the frontend uses cycle.update anyway.
    res.json({ warehouses: {} });
  });

  app.get('/api/states', async (req: Request, res: Response) => {
    const pipeline = [
      { $group: { _id: "$state", count: { $sum: 1 } } }
    ];
    const states = await db.collection('warehouses').aggregate(pipeline).toArray();
    res.json({ states });
  });

  app.get('/api/decisions/recent', async (req: Request, res: Response) => {
    const decisions = await db.collection('agent_decisions')
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    res.json({ decisions });
  });

  app.get('/api/events/active', async (req: Request, res: Response) => {
    const events = await db.collection('unpredictable_events')
      .find({ status: 'active' })
      .toArray();
    res.json({ events });
  });

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => console.log(`API server running on port ${PORT}`));

  // Start polling for changes every 2 seconds
  setInterval(pollChanges, 2000);
  // Broadcast warehouse state every 3 seconds
  setInterval(broadcastWarehouseState, 3000);
}

main().catch(console.error);
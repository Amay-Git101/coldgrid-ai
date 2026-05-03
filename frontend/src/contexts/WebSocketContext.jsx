import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { judgeApi } from '../api/judgeApi';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [coldStores, setColdStores] = useState({});
  const [hqStocks, setHqStocks] = useState({});
  const [hqTrucks, setHqTrucks] = useState({});
  const [deliveries, setDeliveries] = useState([]);
  const [blockedRoads, setBlockedRoads] = useState([]);
  const [disruptionsActive, setDisruptionsActive] = useState({});
  const [decisions, setDecisions] = useState([]);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = async () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      // Optional: Fetch state on reconnect as requested, though backend also sends immediate snapshot
      try {
        const state = await judgeApi.getState();
        if (state) {
          processMessage(state);
        }
      } catch (err) {
        console.error("Failed to fetch REST state on reconnect", err);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CYCLE_UPDATE') {
          processMessage(data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message", error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Reconnect every 3 seconds
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };

    wsRef.current = ws;
  };

  const processMessage = (data) => {
    if (data.cold_stores) setColdStores(data.cold_stores);
    if (data.hq_stocks) setHqStocks(data.hq_stocks);
    if (data.hq_trucks) setHqTrucks(data.hq_trucks);
    if (data.deliveries) setDeliveries(data.deliveries);
    if (data.blocked_roads) setBlockedRoads(data.blocked_roads);
    if (data.disruptions_active) setDisruptionsActive(data.disruptions_active);
    
    if (data.decisions) {
      // Sort and filter by timestamp (descending)
      const sorted = [...data.decisions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setDecisions(sorted);
    }
  };

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      coldStores,
      hqStocks,
      hqTrucks,
      deliveries,
      blockedRoads,
      disruptionsActive,
      decisions
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

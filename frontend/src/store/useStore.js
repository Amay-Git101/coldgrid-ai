import { create } from 'zustand'
import { io } from 'socket.io-client'

// Connect directly to orchestrator WebSocket (port 8000)
// Note: we're using raw WebSocket, not socket.io-client? 
// The orchestrator uses FastAPI WebSocket, not socket.io.
// We'll use native WebSocket API in the store, not socket.io-client.
// So we'll create a simple WebSocket connection.

const socket = new WebSocket('ws://localhost:8000/ws')

const useStore = create((set, get) => ({
  warehouses: {},       // cold stores stocks
  hqStocks: {},
  deliveries: [],
  blockedRoads: [],
  decisions: [],
  selectedColdStore: null,
  connected: false,

  setColdStores: (data) => set({ warehouses: data }),
  setHqStocks: (data) => set({ hqStocks: data }),
  setDeliveries: (data) => set({ deliveries: data }),
  setBlockedRoads: (data) => set({ blockedRoads: data }),
  setDecisions: (data) => set({ decisions: data }),
  setSelectedColdStore: (id) => set({ selectedColdStore: id }),
  setConnected: (status) => set({ connected: status }),
}))

socket.onopen = () => useStore.getState().setConnected(true)
socket.onclose = () => useStore.getState().setConnected(false)
socket.onmessage = (event) => {
  try {
    const payload = JSON.parse(event.data)
    if (payload.type === 'CYCLE_UPDATE') {
      useStore.getState().setColdStores(payload.cold_stores || {})
      useStore.getState().setHqStocks(payload.hq_stocks || {})
      useStore.getState().setDeliveries(payload.deliveries || [])
      useStore.getState().setBlockedRoads(payload.blocked_roads || [])
      useStore.getState().setDecisions(payload.decisions || [])
    }
  } catch (e) {
    console.error('WebSocket parse error:', e)
  }
}

export default useStore
import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { motion } from 'framer-motion';

export default function CommandBar({ onToggleCommandRail, blockRoadMode, setBlockRoadMode }) {
  const { isConnected, deliveries, coldStores, blockedRoads, decisions } = useWebSocket();
  const [sessionTime, setSessionTime] = useState(0);

  // Derive metrics
  const activeVehicles = deliveries.length;
  
  // Critical stores count
  const criticalStoresCount = Object.entries(coldStores).filter(([_, stocks]) => {
    const products = Object.values(stocks);
    if (products.length === 0) return false;
    const avg = products.reduce((sum, val) => sum + (val / 100), 0) / products.length;
    return avg < 0.3;
  }).length;

  const prevCriticalCount = useRef(criticalStoresCount);
  const [flashCritical, setFlashCritical] = useState(false);

  useEffect(() => {
    if (criticalStoresCount > prevCriticalCount.current) {
      setFlashCritical(true);
      setTimeout(() => setFlashCritical(false), 800);
    }
    prevCriticalCount.current = criticalStoresCount;
  }, [criticalStoresCount]);

  const roadsBlocked = blockedRoads.length;
  const decisionsMade = decisions.length;
  const lateralTransfers = decisions.filter(d => d.agent_type === 'lateral_transfer').length;

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => setSessionTime(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed top-0 left-0 w-full h-[52px] bg-[var(--bg-surface)] border-b border-[var(--border)] z-[1000] flex items-center justify-between px-6 shadow-sm">
      
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-4">
        <div className="font-display text-lg text-[var(--navy)] tracking-tight whitespace-nowrap">
          <span className="text-[var(--amber)]">⬡</span> COLDGRID AI
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--navy)] bg-[var(--bg-elevated)] px-3 py-1 rounded-sm border border-[var(--border)]">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--warning)]'}`}></div>
          {isConnected ? 'LIVE' : 'CONNECTING'}
        </div>
        <div className="font-mono text-[11px] text-[var(--text-secondary)]">
          SESSION: {formatTime(sessionTime)}
        </div>
      </div>

      {/* Center: Live Metrics */}
      <div className="flex items-center gap-8">
        <MetricItem label="ACTIVE VEHICLES" value={activeVehicles} />
        <MetricItem 
          label="CRITICAL STORES" 
          value={criticalStoresCount} 
          flash={flashCritical}
          color={criticalStoresCount > 0 ? 'text-[var(--critical)]' : 'text-[var(--navy)]'}
        />
        <MetricItem 
          label="ROADS BLOCKED" 
          value={roadsBlocked} 
          color={roadsBlocked > 0 ? 'text-[var(--warning)]' : 'text-[var(--navy)]'}
        />
        <MetricItem label="DECISIONS MADE" value={decisionsMade} />
        <MetricItem label="LATERAL TRANSFERS" value={lateralTransfers} />
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setBlockRoadMode(!blockRoadMode)}
          className={`px-3 py-1.5 font-mono text-[11px] border rounded transition-colors ${
            blockRoadMode 
              ? 'bg-[var(--critical)] text-white border-[var(--critical)]' 
              : 'bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          {blockRoadMode ? 'CANCEL BLOCK MODE' : 'BLOCK ROAD MODE'}
        </button>
        <button 
          onClick={onToggleCommandRail}
          className="flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] bg-[var(--navy)] text-white border border-[var(--navy)] rounded hover:opacity-90 transition-opacity"
        >
          <span>⊞</span> COMMAND RAIL
        </button>
      </div>

    </div>
  );
}

function MetricItem({ label, value, flash = false, color = 'text-[var(--navy)]' }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div 
        animate={{ color: flash ? 'var(--critical)' : undefined }}
        transition={{ duration: 0.8 }}
        className={`font-mono text-xl leading-none ${color}`}
      >
        {value}
      </motion.div>
      <div className="font-body text-[9px] uppercase tracking-wider text-[var(--text-secondary)] mt-1">
        {label}
      </div>
    </div>
  );
}

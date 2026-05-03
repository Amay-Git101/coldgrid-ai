import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLayer } from '../contexts/LayerContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { getRoadsSync } from '../constants/worldData';
import { judgeApi } from '../api/judgeApi';
import { Clock, Navigation2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function CorridorLayer() {
  const { selectedCorridor, navigateToNational } = useLayer();
  const { deliveries, blockedRoads, decisions } = useWebSocket();
  const [blockingRoute, setBlockingRoute] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fromNode = selectedCorridor?.fromNode;
  const toNode = selectedCorridor?.toNode;
  
  // Get route data (Must be before early return to obey Rules of Hooks)
  const routes = useMemo(() => {
    if (!fromNode || !toNode) return [];
    const roadsDict = getRoadsSync();
    const key = [fromNode, toNode].sort().join('-');
    return roadsDict[key] || [];
  }, [fromNode, toNode]);

  if (!selectedCorridor) return null;

  // Active deliveries on this corridor
  const corridorDeliveries = deliveries.filter(d => 
    (d.from === fromNode && d.to === toNode) || 
    (d.from === toNode && d.to === fromNode)
  );

  // Last transport decision for this corridor
  const lastDecision = [...decisions].find(d => 
    d.agent_type === 'transportation' && 
    (d.cs_id === fromNode || d.cs_id === toNode)
  );

  const handleBlockRoad = async (routeName) => {
    setBlockingRoute(routeName);
    try {
      await judgeApi.blockRoad(fromNode, toNode, routeName);
      // Let the websocket update the state
      setTimeout(() => setBlockingRoute(null), 1000);
    } catch (err) {
      setToastMessage("Failed to block road: " + err.message);
      setTimeout(() => setToastMessage(null), 4000);
      setBlockingRoute(null);
    }
  };

  return (
    <div className="w-full h-full flex items-end justify-center pointer-events-none pb-[32px]">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[52px] right-6 bg-[var(--critical)] text-white px-4 py-3 rounded shadow-lg font-mono text-xs z-[9999]"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="w-[90%] max-w-6xl bg-[var(--bg-surface)] shadow-2xl border border-[var(--border)] rounded-t-xl overflow-hidden pointer-events-auto"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
          <div className="font-display text-lg text-[var(--navy)]">
            Corridor Intelligence: <span className="text-[var(--text-secondary)]">{fromNode} ↔ {toNode}</span>
          </div>
          <button 
            onClick={navigateToNational}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--border)] text-[var(--navy)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 3 Columns */}
        <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
          {routes.map((r, i) => {
            const rName = typeof r === 'string' ? r : r.route_name;
            const distance = r.distance || 0;
            const time = r.time || 0;
            const risk = r.risk || 0;
            
            const isBlocked = blockedRoads.some(br => 
              (br[0] === fromNode && br[1] === toNode && br[2] === rName) ||
              (br[1] === fromNode && br[0] === toNode && br[2] === rName)
            );

            const activeVehicles = corridorDeliveries.filter(d => d.route_name === rName).length;
            
            let status = 'AVAILABLE';
            let badgeClass = 'bg-[var(--success)] text-white';
            if (isBlocked) {
              status = 'BLOCKED';
              badgeClass = 'bg-[var(--critical)] text-white';
            } else if (activeVehicles > 0) {
              status = 'ACTIVE';
              badgeClass = 'bg-[var(--navy)] text-white';
            }

            const riskLevel = risk > 0.4 ? 'High' : risk > 0.25 ? 'Medium' : 'Low';

            return (
              <div key={rName} className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-display text-xl text-[var(--navy)] leading-tight">{rName}</h3>
                  <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded ${badgeClass}`}>
                    {status}
                  </span>
                </div>

                <div className="space-y-3 mb-6 flex-1 font-mono text-sm text-[var(--navy)]">
                  <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-2 rounded">
                    <span className="flex items-center gap-2 text-[var(--text-secondary)]"><Navigation2 size={14}/> Distance</span>
                    <span>{distance} km</span>
                  </div>
                  <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-2 rounded">
                    <span className="flex items-center gap-2 text-[var(--text-secondary)]"><Clock size={14}/> Est. Time</span>
                    <span>{time} h</span>
                  </div>
                  <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-2 rounded">
                    <span className="flex items-center gap-2 text-[var(--text-secondary)]">Vehicles</span>
                    <span>{activeVehicles} active</span>
                  </div>
                  <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-2 rounded">
                    <span className="flex items-center gap-2 text-[var(--text-secondary)]"><ShieldAlert size={14}/> Risk Level</span>
                    <span className={riskLevel === 'High' ? 'text-[var(--critical)]' : ''}>{riskLevel}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleBlockRoad(rName)}
                  disabled={isBlocked || blockingRoute === rName}
                  className={`w-full py-3 font-mono text-xs tracking-widest font-bold rounded flex items-center justify-center gap-2 transition-all ${
                    isBlocked 
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] cursor-not-allowed border border-[var(--border)]' 
                      : 'bg-[var(--critical)] text-white hover:opacity-90'
                  }`}
                >
                  {blockingRoute === rName ? (
                    <span className="animate-pulse">PROCESSING...</span>
                  ) : isBlocked ? (
                    'ROAD BLOCKED'
                  ) : (
                    <>
                      <AlertTriangle size={14} /> BLOCK THIS ROAD
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)] p-4 flex gap-6 min-h-[140px]">
          
          <div className="flex-1">
            <h4 className="font-mono text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">Active Vehicles on this Corridor</h4>
            {corridorDeliveries.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto no-scrollbar">
                {corridorDeliveries.map(d => {
                  const remHours = (4 * (1 - d.progress)).toFixed(1);
                  const hours = Math.floor(remHours);
                  const mins = Math.round((remHours - hours) * 60);

                  return (
                    <div key={d.id} className="flex items-center justify-between bg-[var(--bg-surface)] p-2 rounded border border-[var(--border)] text-xs">
                      <div className="font-mono text-[var(--navy)] font-semibold">{d.id.substring(0,8)}</div>
                      <div className="font-body text-[var(--text-secondary)]">{d.product} ×{d.quantity}</div>
                      <div className="font-body text-[var(--navy)]">{d.route_name}</div>
                      <div className="font-mono text-[var(--text-secondary)]">ETA: {hours}h {mins}m</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[var(--text-secondary)] italic font-body text-sm mt-4">
                No vehicles on this corridor right now. Agents are monitoring.
              </div>
            )}
          </div>

          <div className="w-[1px] bg-[var(--border)]"></div>

          <div className="flex-1">
            <h4 className="font-mono text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">Last Transport Agent Decision</h4>
            {lastDecision ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-3 rounded h-[100px] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[9px] bg-[#FFF3E0] text-[#E65100] px-1 rounded">TRANSPORT</span>
                  <span className="font-mono text-[9px] text-[var(--text-secondary)]">{new Date(lastDecision.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="font-body text-xs font-semibold text-[var(--navy)] mb-1">{lastDecision.action}</div>
                <div className="font-body text-[11px] text-[var(--text-secondary)]">{lastDecision.reasoning}</div>
              </div>
            ) : (
              <div className="text-[var(--text-secondary)] italic font-body text-sm mt-4">
                No recent decisions for this corridor.
              </div>
            )}
          </div>

        </div>

      </motion.div>
    </div>
  );
}

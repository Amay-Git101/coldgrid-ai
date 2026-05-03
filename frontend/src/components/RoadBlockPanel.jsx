import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../contexts/WebSocketContext';
import { HQ_NODES, CS_NODES, getRoadsSync } from '../constants/worldData';
import { judgeApi } from '../api/judgeApi';
import { X } from 'lucide-react';

export default function RoadBlockPanel({ isOpen, onClose }) {
  const { blockedRoads, deliveries } = useWebSocket();

  const blockedSet = useMemo(() => {
    return new Set((blockedRoads || []).map(br => `${br[0]}|${br[1]}|${br[2]}`));
  }, [blockedRoads]);

  // Build list of all corridors grouped by HQ-CS pair
  const corridors = useMemo(() => {
    const roadsDict = getRoadsSync();
    const ALL_NODES = { ...HQ_NODES, ...CS_NODES };
    const result = [];

    Object.keys(roadsDict).forEach(key => {
      const [a, b] = key.split('-');
      const nodeA = ALL_NODES[a];
      const nodeB = ALL_NODES[b];
      if (!nodeA || !nodeB) return;
      const routes = roadsDict[key];
      result.push({ key, nodeA, nodeB, routes });
    });

    return result;
  }, []);

  const handleBlock = async (nodeA, nodeB, routeName) => {
    try {
      await judgeApi.blockRoad(nodeA, nodeB, routeName);
    } catch (e) { console.error(e); }
  };

  const handleUnblock = async (nodeA, nodeB, routeName) => {
    try {
      await judgeApi.unblockRoad(nodeA, nodeB, routeName);
    } catch (e) { console.error(e); }
  };

  const isBlocked = (nodeA, nodeB, routeName) =>
    blockedSet.has(`${nodeA}|${nodeB}|${routeName}`) ||
    blockedSet.has(`${nodeB}|${nodeA}|${routeName}`);

  const vehiclesOnRoute = (nodeA, nodeB, routeName) =>
    (deliveries || []).filter(d =>
      ((d.from === nodeA && d.to === nodeB) || (d.from === nodeB && d.to === nodeA)) &&
      (d.route?.[0]?.route_name === routeName || d.route_name === routeName)
    ).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-[52px] left-0 bottom-[32px] w-[340px] bg-[var(--bg-surface)] border-r border-[var(--border)] z-[2000] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-elevated)]">
            <div>
              <h2 className="font-mono text-sm tracking-widest text-[var(--navy)] font-bold">ACTIVE ROAD NETWORK</h2>
              <p className="font-body text-[10px] text-[var(--text-secondary)] mt-0.5">
                Click BLOCK to disable a route. Map clicks also work.
              </p>
            </div>
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--critical)]">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {corridors.map(({ key, nodeA, nodeB, routes }) => {
              const labelA = nodeA.name || nodeA.id;
              const labelB = nodeB.name || nodeB.id;
              const isLateral = nodeA.id.startsWith('CS_') && nodeB.id.startsWith('CS_');

              return (
                <div key={key} className="border-b border-[var(--border)]">
                  {/* Corridor header */}
                  <div className={`px-4 py-2 flex items-center gap-2 ${isLateral ? 'bg-[#FFF8E1]' : 'bg-[var(--bg-elevated)]'}`}>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isLateral ? 'bg-[var(--amber)] text-white' : 'bg-[var(--navy)] text-white'}`}>
                      {isLateral ? 'LATERAL' : 'SUPPLY'}
                    </span>
                    <span className="font-body text-xs font-semibold text-[var(--navy)] truncate">
                      {labelA} → {labelB}
                    </span>
                  </div>

                  {/* Routes */}
                  {(Array.isArray(routes) ? routes : []).map((r, i) => {
                    const routeName = typeof r === 'string' ? r : r.route_name;
                    const blocked = isBlocked(nodeA.id, nodeB.id, routeName);
                    const vehicles = vehiclesOnRoute(nodeA.id, nodeB.id, routeName);

                    return (
                      <div key={routeName + i} className={`px-4 py-2 flex items-center justify-between gap-2 ${blocked ? 'bg-[#FFF5F5]' : 'hover:bg-[var(--bg-elevated)]'} transition-colors`}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-mono text-xs text-[var(--navy)] truncate">{routeName}</span>
                          {vehicles > 0 && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--navy)] text-white flex-shrink-0">
                              ● {vehicles}
                            </span>
                          )}
                          {blocked && (
                            <span className="text-[9px] font-mono font-bold text-[var(--critical)] flex-shrink-0">✕ BLOCKED</span>
                          )}
                        </div>
                        <button
                          onClick={() => blocked
                            ? handleUnblock(nodeA.id, nodeB.id, routeName)
                            : handleBlock(nodeA.id, nodeB.id, routeName)
                          }
                          className={`flex-shrink-0 px-2.5 py-1 rounded font-mono text-[9px] font-bold transition-colors ${
                            blocked
                              ? 'bg-[var(--bg-elevated)] text-[var(--success)] border border-[var(--success)] hover:bg-[var(--success)] hover:text-white'
                              : 'bg-[var(--critical)] text-white hover:opacity-80'
                          }`}
                        >
                          {blocked ? 'UNBLOCK' : 'BLOCK'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

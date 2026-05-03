import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useLayer } from '../contexts/LayerContext';
import { judgeApi } from '../api/judgeApi';
import { X, Layers } from 'lucide-react';

// ── Badge config per agent type ────────────────────────────
const AGENT_STYLES = {
  inventory:        { label: 'INVENTORY',  cls: 'bg-[#E3F2FD] text-[#1565C0]', dot: '#1565C0' },
  supplier:         { label: 'SUPPLY',     cls: 'bg-[#F3E5F5] text-[#7B1FA2]', dot: '#7B1FA2' },
  supply:           { label: 'SUPPLY',     cls: 'bg-[#F3E5F5] text-[#7B1FA2]', dot: '#7B1FA2' },
  transportation:   { label: 'TRANSPORT',  cls: 'bg-[#FFF3E0] text-[#E65100]', dot: '#E65100' },
  lateral_transfer: { label: 'LATERAL',    cls: 'bg-[#FFF8E1] text-[#C4873A]', dot: '#C4873A' },
  alert:            { label: 'ALERT',      cls: 'bg-[#FFEBEE] text-[#B83232]', dot: '#B83232' },
  demand_forecast:  { label: 'FORECAST',   cls: 'bg-[#E8F5E9] text-[#2E7D32]', dot: '#2E7D32' },
};
const DEFAULT_STYLE = { label: 'SYSTEM', cls: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]', dot: '#9E9E9E' };

const getStyle = (agent_type) => AGENT_STYLES[agent_type] || DEFAULT_STYLE;

// ── Decision Card ─────────────────────────────────────────────
function DecisionCard({ decision: d, isChainHead, isChainMember }) {
  const s = getStyle(d.agent_type);
  const time = d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : '';
  const isEscalation = !!d.escalation_chain_id;
  const isCritical = d.action?.toLowerCase().includes('critical') || d.reasoning?.toLowerCase().includes('critical') || d.decision?.toLowerCase().includes('critical');
  const isResolved = d.action?.toLowerCase().includes('resolv') || d.decision === 'LATERAL_DISPATCH';

  let borderColor = 'border-[var(--border)]';
  if (isCritical && !isResolved) borderColor = 'border-[var(--critical)]';
  if (isResolved) borderColor = 'border-[var(--success)]';
  if (d.agent_type === 'lateral_transfer') borderColor = 'border-[var(--amber)]';

  return (
    <div className="flex gap-0">
      {/* Chain line (Fix 7) */}
      {isChainMember && (
        <div className="flex flex-col items-center mr-2 flex-shrink-0">
          <div className="w-px bg-[var(--critical)] flex-1 min-h-[8px]" />
          <div className="w-2 h-2 rounded-full border-2 border-[var(--critical)] bg-white flex-shrink-0" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex-1 p-3 rounded border shadow-sm ${borderColor} bg-[var(--bg-surface)] ${isCritical && !isResolved ? 'shadow-red-100' : ''}`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${s.cls}`}>{s.label}</span>
            {d.cs_id && <span className="text-[9px] font-mono text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">{d.cs_id}</span>}
            {isCritical && !isResolved && <span className="text-[9px] font-mono font-bold text-[var(--critical)] px-1.5 py-0.5 rounded bg-[#FFEBEE]">🔴 CRITICAL</span>}
            {isResolved && <span className="text-[9px] font-mono font-bold text-[var(--success)] px-1.5 py-0.5 rounded bg-[#E8F5E9]">🟢 RESOLVED</span>}
          </div>
          <span className="text-[9px] font-mono text-[var(--text-secondary)] flex-shrink-0">{time}</span>
        </div>
        <div className="font-body text-xs font-semibold text-[var(--navy)] mb-0.5">{d.action || d.decision || 'Decision'}</div>
        <div className="font-body text-[11px] text-[var(--text-secondary)] leading-snug">{d.reasoning}</div>
        {d.confidence_score && (
          <div className="mt-1.5 font-mono text-[9px] text-[var(--text-secondary)]">
            Conf: {Math.round(d.confidence_score * 100)}%
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Chain group renderer (Fix 7) ──────────────────────────────
function ChainGroup({ decisions: chain }) {
  if (chain.length === 1) return <DecisionCard decision={chain[0]} />;
  return (
    <div className="border border-[var(--critical)] rounded-lg overflow-hidden bg-[#FFF8F8] p-2 space-y-1">
      <div className="font-mono text-[9px] font-bold text-[var(--critical)] uppercase tracking-wider px-1 pb-1 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[var(--critical)] animate-pulse" />
        Agent Escalation Chain · {chain.length} steps
      </div>
      {chain.map((d, i) => (
        <DecisionCard key={d._id || i} decision={d} isChainMember={true} />
      ))}
    </div>
  );
}

const FILTER_OPTIONS = [
  { key: 'all',             label: 'ALL' },
  { key: 'inventory',       label: 'INVENTORY' },
  { key: 'supply',          label: 'SUPPLY' },
  { key: 'transportation',  label: 'TRANSPORT' },
  { key: 'lateral_transfer', label: 'LATERAL' },
  { key: 'alert',           label: 'CRITICAL', extraFilter: d => {
    const text = `${d.action || ''} ${d.reasoning || ''}`.toLowerCase();
    return text.includes('critical') || text.includes('alert') || d.agent_type === 'alert';
  }},
];

export default function CommandRail({ isOpen, onClose, setBlockRoadMode }) {
  const { coldStores, deliveries, blockedRoads, decisions } = useWebSocket();
  const { navigateToColdStore } = useLayer();
  const [feedFilter, setFeedFilter] = useState('all');
  const [selectedCsToDisrupt, setSelectedCsToDisrupt] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  // Compute metrics
  const activeVehicles = (deliveries || []).length;
  const criticalCount = Object.keys(coldStores || {}).filter(id => {
    const ps = Object.values(coldStores[id] || {});
    if (!ps.length) return false;
    return ps.reduce((a, v) => a + v / 100, 0) / ps.length < 0.3;
  }).length;

  const csNames = Object.keys(coldStores || {}).sort();

  const handleBlockRoadMode = () => { setBlockRoadMode(true); onClose(); };
  const handleDisruptStore = async () => {
    if (!selectedCsToDisrupt) return;
    try {
      await judgeApi.spikeDemand(selectedCsToDisrupt, 5.0);
      showToast(`Demand spike triggered on ${selectedCsToDisrupt}`);
    } catch (e) { showToast('Failed: ' + e.message); }
  };

  // ── Fix 8: Filter + group decisions ─────────────────────────
  const groupedFeed = useMemo(() => {
    const allDecisions = (decisions || []).slice(0, 60);
    const filterOpt = FILTER_OPTIONS.find(f => f.key === feedFilter);

    let filtered = allDecisions;
    if (feedFilter !== 'all') {
      filtered = allDecisions.filter(d => {
        if (filterOpt?.extraFilter) return filterOpt.extraFilter(d);
        return d.agent_type === feedFilter || d.supplier === feedFilter;
      });
    }

    // Group by escalation_chain_id (Fix 7)
    const chains = {};
    const standalone = [];
    filtered.forEach(d => {
      if (d.escalation_chain_id) {
        if (!chains[d.escalation_chain_id]) chains[d.escalation_chain_id] = [];
        chains[d.escalation_chain_id].push(d);
      } else {
        standalone.push(d);
      }
    });

    const result = [];
    // Interleave chains and standalones in timestamp order
    const allGroups = [
      ...standalone.map(d => ({ type: 'standalone', d, ts: new Date(d.timestamp || 0).getTime() })),
      ...Object.values(chains).map(chain => ({
        type: 'chain', chain: chain.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        ts: new Date(chain[0].timestamp || 0).getTime()
      }))
    ].sort((a, b) => b.ts - a.ts);

    return allGroups;
  }, [decisions, feedFilter]);

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[52px] right-6 bg-[var(--critical)] text-white px-4 py-3 rounded shadow-lg font-mono text-xs z-[9999]">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[52px] right-0 bottom-[32px] w-[380px] bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-2xl z-[1500] flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-elevated)]">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-[var(--navy)]" />
                <h2 className="font-mono text-sm font-bold tracking-widest text-[var(--navy)]">COMMAND RAIL</h2>
              </div>
              <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--critical)]"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-5 flex flex-col gap-5">

              {/* System Pulse */}
              <section>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-3">System Pulse</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Active Vehicles', value: activeVehicles },
                    { label: 'Critical Stores', value: criticalCount, accent: criticalCount > 0 },
                    { label: 'Roads Blocked', value: (blockedRoads || []).length, accent: (blockedRoads || []).length > 0 },
                    { label: 'Decisions', value: (decisions || []).length },
                  ].map(m => (
                    <div key={m.label} className="bg-[var(--bg-elevated)] rounded p-3 border border-[var(--border)]">
                      <div className={`font-mono text-2xl ${m.accent ? 'text-[var(--critical)]' : 'text-[var(--navy)]'}`}>{m.value}</div>
                      <div className="font-body text-[9px] uppercase tracking-wider text-[var(--text-secondary)] mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Actions */}
              <section>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-3">Quick Actions</h3>
                <button
                  onClick={handleBlockRoadMode}
                  className="w-full py-2.5 bg-[var(--critical)] text-white font-mono text-xs rounded tracking-wider hover:opacity-90 transition-opacity mb-3"
                >BLOCK A ROAD</button>
                <div className="flex gap-2">
                  <select
                    value={selectedCsToDisrupt}
                    onChange={e => setSelectedCsToDisrupt(e.target.value)}
                    className="flex-1 border border-[var(--border)] rounded py-1.5 px-2 font-body text-xs text-[var(--navy)] bg-[var(--bg-elevated)]"
                  >
                    <option value="">Pick a Store to Disrupt...</option>
                    {csNames.map(id => <option key={id} value={id}>{id}</option>)}
                  </select>
                  {selectedCsToDisrupt && (
                    <button onClick={() => navigateToColdStore(selectedCsToDisrupt)}
                      className="px-3 py-1.5 border border-[var(--navy)] text-[var(--navy)] rounded font-mono text-[10px] hover:bg-[var(--navy)] hover:text-white transition-colors">
                      OPEN
                    </button>
                  )}
                </div>
              </section>

              {/* Fix 8: Global Agent Feed with Filters */}
              <section className="flex-1 flex flex-col min-h-0">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2">Global Agent Feed</h3>

                {/* Filter bar */}
                <div className="flex gap-1 flex-wrap mb-3">
                  {FILTER_OPTIONS.map(f => {
                    const s = getStyle(f.key === 'all' ? 'all' : f.key === 'alert' ? 'alert' : f.key);
                    const active = feedFilter === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => setFeedFilter(f.key)}
                        className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold transition-all border ${
                          active ? `${s.cls} border-transparent shadow-sm` : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--navy)]'
                        }`}
                      >{f.label}</button>
                    );
                  })}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                  {groupedFeed.length === 0 ? (
                    <div className="text-center text-[var(--text-secondary)] font-body text-sm py-12">
                      No events for this filter.
                    </div>
                  ) : (
                    groupedFeed.map((group, i) =>
                      group.type === 'standalone'
                        ? <DecisionCard key={group.d._id || i} decision={group.d} />
                        : <ChainGroup key={group.chain[0]._id || i} decisions={group.chain} />
                    )
                  )}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

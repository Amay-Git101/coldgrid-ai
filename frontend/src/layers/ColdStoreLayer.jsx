import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLayer } from '../contexts/LayerContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { CS_NODES, HQ_NODES } from '../constants/worldData';
import { judgeApi } from '../api/judgeApi';
import { Droplet, Waves, TrendingUp, ThermometerSnowflake, ChevronDown, X } from 'lucide-react';

const PRODUCT_CAPACITIES = {
  dairy: 100, meat: 100, seafood: 100, frozen_meals: 100,
  medicine: 100, ice_cream: 100, beverages: 100, vegetables: 100,
  eggs: 100, bakery: 100
};

const PRODUCTS = Object.keys(PRODUCT_CAPACITIES);

// ── Typewriter component ─────────────────────────────────────
function Typewriter({ text, speed = 28, onDone }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(prev => prev + text[indexRef.current]);
        indexRef.current++;
      } else {
        clearInterval(interval);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="font-mono text-[11px] text-[var(--navy)] leading-relaxed whitespace-pre-line">
      {displayed}
      <span className="animate-pulse">▌</span>
    </span>
  );
}

// ── SKU Picker ───────────────────────────────────────────────
function SkuPicker({ stocks, onSelect, onCancel, verb }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute z-10 top-full left-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded shadow-xl p-3 w-[260px]"
    >
      <div className="font-mono text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">Select product to {verb}:</div>
      <div className="grid grid-cols-2 gap-1.5">
        {PRODUCTS.map(p => {
          const pct = Math.round(((stocks[p] ?? 0) / 100) * 100);
          return (
            <button
              key={p}
              onClick={() => onSelect(p)}
              className="flex items-center justify-between px-2 py-1.5 rounded border border-[var(--border)] hover:border-[var(--navy)] hover:bg-[var(--bg-elevated)] transition-all text-left"
            >
              <span className="font-body text-[11px] capitalize text-[var(--navy)]">{p.replace('_', ' ')}</span>
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">{pct}%</span>
            </button>
          );
        })}
      </div>
      <button onClick={onCancel} className="mt-2 w-full font-mono text-[10px] text-[var(--text-secondary)] hover:text-[var(--critical)] flex items-center gap-1 justify-center">
        <X size={10} /> Cancel
      </button>
    </motion.div>
  );
}

// ── Agent Response box ────────────────────────────────────────
function AgentResponseBox({ text, onClose }) {
  const [done, setDone] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[var(--amber)] bg-[#FFFBF0] rounded p-4 relative"
    >
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: done ? 0 : Infinity }}
          className="w-2 h-2 rounded-full bg-[var(--amber)]"
        />
        <span className="font-mono text-[11px] text-[var(--amber)] font-bold uppercase tracking-widest">
          ⚡ Agent Responding
        </span>
        <button onClick={onClose} className="ml-auto text-[var(--text-secondary)] hover:text-[var(--critical)]">
          <X size={12} />
        </button>
      </div>
      <Typewriter text={text} speed={28} onDone={() => setDone(true)} />
    </motion.div>
  );
}

// ── Incoming delivery row ─────────────────────────────────────
function IncomingDeliveryRow({ delivery }) {
  const isLateral = delivery.from?.startsWith('CS_');
  const pct = Math.round((delivery.progress ?? 0) * 100);
  const remHours = (4 * (1 - (delivery.progress ?? 0)));
  const hours = Math.floor(remHours);
  const mins = Math.round((remHours - hours) * 60);

  const fromName = (HQ_NODES[delivery.from]?.name || CS_NODES[delivery.from]?.name || delivery.from || '').replace(' HQ', '').replace(' CS', '');
  const toName = (CS_NODES[delivery.to]?.name || delivery.to || '').replace(' CS', '');

  const urgencyColor = delivery.urgency === 'critical' ? 'text-[var(--critical)]' :
                       delivery.urgency === 'important' ? 'text-[var(--amber)]' : 'text-[var(--success)]';

  return (
    <div className={`p-3 rounded border shadow-sm ${isLateral ? 'border-[var(--disrupted)] bg-[#F3F0FA]' : 'border-[var(--border)] bg-[var(--bg-surface)]'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-[var(--navy)]">
            ▶ {(delivery.id || '').substring(0, 8)}
          </span>
          {isLateral && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--disrupted)] text-white">
              LATERAL
            </span>
          )}
          {delivery.urgency === 'critical' && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--critical)] text-white animate-pulse">
              EMERGENCY
            </span>
          )}
        </div>
        <span className={`font-mono text-[10px] font-bold ${urgencyColor}`}>
          {delivery.urgency?.toUpperCase() || 'NORMAL'}
        </span>
      </div>

      <div className="font-body text-[11px] text-[var(--text-secondary)] mb-1.5">
        {fromName} → {toName}
        {delivery.route?.[0]?.route_name && (
          <span className="ml-1 opacity-70">· {delivery.route[0].route_name}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-1.5">
        <motion.div
          className={`h-full rounded-full ${isLateral ? 'bg-[var(--disrupted)]' : 'bg-[var(--navy)]'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] text-[var(--text-secondary)]">
        <span>{pct}% of journey</span>
        <span>ETA: ~{hours}h {mins}m</span>
      </div>

      {delivery.product && (
        <div className="mt-1.5 font-body text-[11px] text-[var(--navy)]">
          Cargo: <span className="capitalize font-semibold">{delivery.product?.replace('_', ' ')}</span>
          {delivery.quantity && <span> × {Math.round(delivery.quantity)} units</span>}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ColdStoreLayer() {
  const { selectedCsId, navigateToNational } = useLayer();
  const { coldStores, decisions, disruptionsActive, deliveries } = useWebSocket();

  const [toastMessage, setToastMessage] = useState(null);
  const [drainPickerOpen, setDrainPickerOpen] = useState(false);
  const [floodPickerOpen, setFloodPickerOpen] = useState(false);
  const [agentResponse, setAgentResponse] = useState(null);

  // Reset pickers/response when CS changes
  useEffect(() => {
    setDrainPickerOpen(false);
    setFloodPickerOpen(false);
    setAgentResponse(null);
  }, [selectedCsId]);

  if (!selectedCsId) return null;

  const nodeInfo = CS_NODES[selectedCsId];
  if (!nodeInfo) return null;

  const stocks = coldStores[selectedCsId] || {};
  const activeDisruption = disruptionsActive[selectedCsId] || {};

  // Incoming deliveries for this store
  const incomingDeliveries = (deliveries || []).filter(d => d?.to === selectedCsId && d?.status !== 'arrived');

  // Recent decisions related to this CS
  const csDecisions = (decisions || []).filter(d => {
    if (!d) return false;
    if (d.cs_id === selectedCsId || d.warehouse_id === selectedCsId) return true;
    if (d.agent_type === 'transportation' && (d.action?.includes(selectedCsId) || d.reasoning?.includes(selectedCsId))) return true;
    if (d.agent_type === 'lateral_transfer' && (d.action?.includes(selectedCsId) || d.reasoning?.includes(selectedCsId))) return true;
    return false;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const buildAgentResponse = (disruption, product) => {
    const cs = nodeInfo.name;
    const hq = (nodeInfo.primary_hq || '').replace('HQ_', '');
    if (disruption === 'drain') {
      return `INVENTORY AGENT · ${selectedCsId}
-${product?.replace('_', ' ')} stock critically depleted.
-Priority restock initiated. Filing emergency\nrequest to HQ_${hq}.
-Fleet check: scanning available vehicles.
-Estimating bundled delivery window.
-Cross-checking alternate lateral sources.

Confidence: 91% · Decision time: 0.2s`;
    }
    if (disruption === 'flood') {
      return `INVENTORY AGENT · ${selectedCsId}
-${product?.replace('_', ' ')} overflow detected.
-Restock requests suspended for this SKU.
-Flagging surplus — alerting adjacent cold\nstores for potential lateral pull.
-Demand forecast adjusted +0.3× for next cycle.

Confidence: 88% · Decision time: 0.1s`;
    }
    if (disruption === 'spike') {
      return `INVENTORY AGENT · ${selectedCsId}
-Demand spike 5× detected across all SKUs.
-Triage initiated — medicine priority 1\n(expiry critical). Frozen meals priority 2.
-Emergency request filed to HQ_${hq}.
-Fleet check: querying available vehicles.
-Bundling high-priority SKUs per truck capacity.
-ETA estimated based on nearest route.

Confidence: 94% · Decision time: 0.3s`;
    }
    if (disruption === 'coldchain') {
      return `INVENTORY AGENT · ${selectedCsId}
-Cold chain failure confirmed.
-Perishables at risk: dairy, meat, seafood,\nice cream, medicine flagged critical.
-Emergency escalation to HQ_${hq} filed.
-Lateral scan initiated — checking CS network\nfor medicine surplus within range.
-ALERT AGENT notified. Manual intervention\nrecommended for temperature-sensitive stock.

Confidence: 97% · Decision time: 0.4s`;
    }
    return '';
  };

  const handleDrainStock = async (product) => {
    setDrainPickerOpen(false);
    try {
      await judgeApi.drainStock(selectedCsId, product);
      setAgentResponse(buildAgentResponse('drain', product));
    } catch (err) { showToast('Failed to drain: ' + err.message); }
  };

  const handleFloodStock = async (product) => {
    setFloodPickerOpen(false);
    try {
      await judgeApi.floodStock(selectedCsId, product, 100);
      setAgentResponse(buildAgentResponse('flood', product));
    } catch (err) { showToast('Failed to flood: ' + err.message); }
  };

  const handleSpikeDemand = async () => {
    try {
      await judgeApi.spikeDemand(selectedCsId, 5.0);
      setAgentResponse(buildAgentResponse('spike'));
    } catch (err) { showToast('Failed to spike demand: ' + err.message); }
  };

  const handleColdChainFailure = async () => {
    try {
      if (activeDisruption.cold_chain_failed) {
        await judgeApi.restoreColdChain(selectedCsId);
        setAgentResponse(
          `INVENTORY AGENT · ${selectedCsId}\nCold chain restored. Temperature systems online.\nInitiating stock recovery audit.\nPerishable restocking requests filed to HQ.\n\nConfidence: 99% · Recovery time: 0.1s`
        );
      } else {
        await judgeApi.coldChainFailure(selectedCsId);
        setAgentResponse(buildAgentResponse('coldchain'));
      }
    } catch (err) { showToast('Cold chain action failed: ' + err.message); }
  };

  return (
    <div className="w-full h-full flex justify-end pointer-events-none">

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[52px] right-6 bg-[var(--critical)] text-white px-4 py-3 rounded shadow-lg font-mono text-xs z-[9999]"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right panel */}
      <motion.div
        className="w-[60%] h-full bg-white/97 backdrop-blur-md border-l border-[var(--border)] shadow-2xl pointer-events-auto flex flex-col pt-[52px] pb-[32px]"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-[var(--border)] flex justify-between items-start bg-[var(--bg-surface)] flex-shrink-0">
          <div>
            <h1 className="font-display text-3xl text-[var(--navy)] mb-1">{nodeInfo.name}</h1>
            <div className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-3">
              <span>{nodeInfo.id}</span><span>·</span>
              <span>{nodeInfo.state}</span><span>·</span>
              <span>Provider: {(nodeInfo.primary_hq || '').replace('HQ_', '')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {activeDisruption.demand_spike && (
              <div className="bg-[var(--critical)] text-white px-3 py-1 rounded font-mono text-xs animate-pulse font-bold">
                DEMAND SPIKE ACTIVE
              </div>
            )}
            {activeDisruption.cold_chain_failed && (
              <div className="flex items-center gap-2">
                <div className="bg-[var(--disrupted)] text-white px-3 py-1 rounded font-mono text-xs animate-pulse font-bold">
                  COLD CHAIN FAILED
                </div>
                <button
                  onClick={handleColdChainFailure}
                  className="bg-white border border-[var(--disrupted)] text-[var(--disrupted)] px-2 py-0.5 rounded font-mono text-[10px] font-bold hover:bg-[var(--disrupted)] hover:text-white transition-colors"
                >
                  RESTORE
                </button>
              </div>
            )}
            <button
              onClick={navigateToNational}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border)] text-[var(--navy)] transition-colors border border-[var(--border)]"
            >✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-6">

          {/* ── Inventory Health ── */}
          <section>
            <h2 className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-3 border-b border-[var(--border)] pb-1.5">
              Inventory Health
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {PRODUCTS.map(product => {
                const stock = stocks[product] !== undefined ? stocks[product] : 0;
                const pct = Math.min(100, Math.round((stock / 100) * 100));
                const isCritical = pct < 30;
                return (
                  <div key={product} className={`p-2.5 rounded border shadow-sm relative overflow-hidden ${isCritical ? 'border-[var(--critical)] bg-[#FFEBEE]' : 'border-[var(--border)] bg-[var(--bg-surface)]'}`}>
                    <div className="font-body text-[10px] text-[var(--text-secondary)] capitalize mb-0.5">{product.replace('_', ' ')}</div>
                    <div className={`font-mono text-xl ${isCritical ? 'text-[var(--critical)] animate-pulse' : 'text-[var(--navy)]'}`}>
                      {pct}%
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-[var(--border)]" />
                    <div className={`absolute bottom-0 left-0 h-1 ${isCritical ? 'bg-[var(--critical)]' : 'bg-[var(--navy)]'}`} style={{ width: `${pct}%`, transition: 'width 0.5s ease-out' }} />
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Incoming Deliveries (Fix 10) ── */}
          {incomingDeliveries.length > 0 && (
            <section>
              <h2 className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-3 border-b border-[var(--border)] pb-1.5">
                Incoming Deliveries ({incomingDeliveries.length})
              </h2>
              <div className="flex flex-col gap-2">
                {incomingDeliveries.map((d, i) => (
                  <IncomingDeliveryRow key={d?.id || i} delivery={d} />
                ))}
              </div>
            </section>
          )}

          {/* ── Disruption Controls (Fix 5) ── */}
          <section>
            <h2 className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-3 border-b border-[var(--border)] pb-1.5">
              Disruption Controls
            </h2>
            <div className="grid grid-cols-2 gap-3">

              {/* Drain SKU */}
              <div className="relative">
                <button
                  onClick={() => { setDrainPickerOpen(!drainPickerOpen); setFloodPickerOpen(false); }}
                  className="w-full flex flex-col items-center justify-center p-4 rounded border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors group"
                >
                  <Droplet className="text-[var(--warning)] mb-1.5 group-hover:scale-110 transition-transform" size={20} />
                  <span className="font-mono text-[10px] font-bold text-[var(--navy)]">💧 DRAIN A SKU</span>
                  <span className="font-body text-[9px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-0.5">
                    click to select product <ChevronDown size={9} />
                  </span>
                </button>
                <AnimatePresence>
                  {drainPickerOpen && (
                    <SkuPicker stocks={stocks} onSelect={handleDrainStock} onCancel={() => setDrainPickerOpen(false)} verb="drain" />
                  )}
                </AnimatePresence>
              </div>

              {/* Flood SKU */}
              <div className="relative">
                <button
                  onClick={() => { setFloodPickerOpen(!floodPickerOpen); setDrainPickerOpen(false); }}
                  className="w-full flex flex-col items-center justify-center p-4 rounded border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors group"
                >
                  <Waves className="text-[#1565C0] mb-1.5 group-hover:scale-110 transition-transform" size={20} />
                  <span className="font-mono text-[10px] font-bold text-[var(--navy)]">📦 FLOOD A SKU</span>
                  <span className="font-body text-[9px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-0.5">
                    click to select product <ChevronDown size={9} />
                  </span>
                </button>
                <AnimatePresence>
                  {floodPickerOpen && (
                    <SkuPicker stocks={stocks} onSelect={handleFloodStock} onCancel={() => setFloodPickerOpen(false)} verb="flood" />
                  )}
                </AnimatePresence>
              </div>

              {/* Spike Demand */}
              <button
                onClick={handleSpikeDemand}
                className="flex flex-col items-center justify-center p-4 rounded border border-[var(--critical)] bg-[#FFEBEE] hover:bg-[#FFCDD2] transition-colors group"
              >
                <TrendingUp className="text-[var(--critical)] mb-1.5 group-hover:scale-110 transition-transform" size={20} />
                <span className="font-mono text-[10px] font-bold text-[var(--critical)]">📈 SPIKE DEMAND 5×</span>
                <span className="font-body text-[9px] text-[var(--text-secondary)] mt-0.5">90 second surge</span>
              </button>

              {/* Cold Chain Failure / Restore */}
              <button
                onClick={handleColdChainFailure}
                className={`flex flex-col items-center justify-center p-4 rounded border transition-colors group ${
                  activeDisruption.cold_chain_failed
                    ? 'border-[var(--success)] bg-[#E8F5E9] hover:bg-[#C8E6C9]'
                    : 'border-[var(--disrupted)] bg-[#E8EAF6] hover:bg-[#C5CAE9]'
                }`}
              >
                <ThermometerSnowflake
                  className={`mb-1.5 group-hover:scale-110 transition-transform ${
                    activeDisruption.cold_chain_failed ? 'text-[var(--success)]' : 'text-[var(--disrupted)]'
                  }`}
                  size={20}
                />
                <span className={`font-mono text-[10px] font-bold ${
                  activeDisruption.cold_chain_failed ? 'text-[var(--success)]' : 'text-[var(--disrupted)]'
                }`}>
                  {activeDisruption.cold_chain_failed ? '✅ RESTORE COLD CHAIN' : '❄️ COLD CHAIN FAILURE'}
                </span>
                <span className="font-body text-[9px] text-[var(--text-secondary)] mt-0.5">
                  {activeDisruption.cold_chain_failed ? 'click to recover store' : 'wipes all perishables'}
                </span>
              </button>
            </div>

            {/* Agent Response Typewriter (Fix 5) */}
            <AnimatePresence>
              {agentResponse && (
                <motion.div className="mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <AgentResponseBox text={agentResponse} onClose={() => setAgentResponse(null)} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* ── Local Agent Feed ── */}
          <section className="flex-1 flex flex-col min-h-0">
            <h2 className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-3 border-b border-[var(--border)] pb-1.5">
              Local Agent Feed
            </h2>
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2">
              {csDecisions.length > 0 ? (
                csDecisions.slice(0, 50).map((d, i) => {
                  if (!d) return null;
                  let badgeClass = 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]';
                  let label = (d.agent_type || 'system').toUpperCase().replace('_', ' ');
                  if (d.agent_type === 'inventory')       badgeClass = 'bg-[#E3F2FD] text-[#1565C0]';
                  if (d.agent_type === 'supplier')        badgeClass = 'bg-[#F3E5F5] text-[#7B1FA2]';
                  if (d.agent_type === 'transportation')  badgeClass = 'bg-[#FFF3E0] text-[#E65100]';
                  if (d.agent_type === 'lateral_transfer') badgeClass = 'bg-[#FFF8E1] text-[var(--amber)]';
                  if (d.agent_type === 'alert')           badgeClass = 'bg-[#FFEBEE] text-[var(--critical)]';

                  return (
                    <div key={d.id || i} className="p-3 rounded border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm flex-shrink-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${badgeClass}`}>{label}</span>
                        <span className="text-[9px] font-mono text-[var(--text-secondary)]">
                          {d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <div className="font-body text-xs font-semibold text-[var(--navy)] mb-0.5">{d.action || d.decision}</div>
                      <div className="font-body text-[11px] text-[var(--text-secondary)]">{d.reasoning}</div>
                    </div>
                  );
                })
              ) : (
                <div className="text-[var(--text-secondary)] italic font-body text-sm py-8 text-center">
                  No recent local events. Agents are observing.
                </div>
              )}
            </div>
          </section>

        </div>
      </motion.div>
    </div>
  );
}

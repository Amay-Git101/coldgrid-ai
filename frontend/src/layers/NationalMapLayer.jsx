import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Tooltip as LTooltip, SVGOverlay } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useLayer } from '../contexts/LayerContext';
import { HQ_NODES, CS_NODES, getRoadsSync } from '../constants/worldData';
import { offsetPolyline, getPointAlongPath, getAngleAlongPath } from '../utils/geometry';

import CommandBar from '../components/CommandBar';
import BottomTicker from '../components/BottomTicker';
import CommandRail from '../components/CommandRail';
import RoadBlockPanel from '../components/RoadBlockPanel';

// ── Breadcrumb ───────────────────────────────────────────────
function Breadcrumb() {
  const { currentLayer, selectedCorridor, selectedCsId, navigateToNational, navigateToCorridor } = useLayer();
  if (currentLayer === 'globe' || currentLayer === 'national') return null;
  return (
    <div className="fixed top-[60px] left-[20px] z-[1000] flex items-center gap-2 font-mono text-[11px] text-[var(--navy)] bg-[var(--bg-surface)] px-3 py-1.5 rounded border border-[var(--border)] shadow-sm">
      <button onClick={navigateToNational} className="hover:underline opacity-70 hover:opacity-100">India Network</button>
      {selectedCorridor && (
        <><span className="opacity-50">›</span>
        <span className="font-bold">{selectedCorridor.fromNode}–{selectedCorridor.toNode}</span></>
      )}
      {selectedCsId && (
        <><span className="opacity-50">›</span>
        <span className="font-bold">{selectedCsId}</span></>
      )}
    </div>
  );
}

// ── Particle Overlay (canvas-based flow dots) ────────────────
function ParticleOverlay({ corridors, deliveries }) {
  const map = useMap();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const initParticles = () => {
      particles = [];
      corridors.forEach(corr => {
        const corrDeliveries = (deliveries || []).filter(d =>
          (d.from === corr.from.id && d.to === corr.to.id) ||
          (d.from === corr.to.id && d.to === corr.from.id)
        );
        const n = corrDeliveries.length * 2;
        for (let i = 0; i < n; i++) {
          particles.push({
            corr, progress: Math.random(),
            speed: 0.001 + Math.random() * 0.002,
            isLateral: corr.from.id.startsWith('CS_') && corr.to.id.startsWith('CS_')
          });
        }
      });
    };

    initParticles();

    const render = () => {
      const size = map.getSize();
      if (canvas.width !== size.x) canvas.width = size.x;
      if (canvas.height !== size.y) canvas.height = size.y;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const p1 = map.latLngToContainerPoint([p.corr.from.lat, p.corr.from.lng]);
        const p2 = map.latLngToContainerPoint([p.corr.to.lat, p.corr.to.lng]);
        const x = p1.x + (p2.x - p1.x) * p.progress;
        const y = p1.y + (p2.y - p1.y) * p.progress;
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.isLateral ? '#C4873A' : '#FFFFFF'; ctx.globalAlpha = 0.8; ctx.fill();
        ctx.beginPath();
        const tx = p1.x + (p2.x - p1.x) * Math.max(0, p.progress - 0.05);
        const ty = p1.y + (p2.y - p1.y) * Math.max(0, p.progress - 0.05);
        ctx.moveTo(x, y); ctx.lineTo(tx, ty);
        ctx.strokeStyle = p.isLateral ? '#C4873A' : '#FFFFFF';
        ctx.lineWidth = 1.5; ctx.globalAlpha = 0.3; ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      animId = requestAnimationFrame(render);
    };

    render();
    map.on('move', render);
    return () => { cancelAnimationFrame(animId); map.off('move', render); };
  }, [map, corridors, deliveries]);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-[400]" style={{ position: 'absolute' }} />;
}

// ── Lateral Transfer Info Panel (Fix 1) ─────────────────────
function LateralPanel({ delivery, onClose }) {
  if (!delivery) return null;
  const fromName = (CS_NODES[delivery.from]?.name || delivery.from || '').replace(' CS', '');
  const toName = (CS_NODES[delivery.to]?.name || delivery.to || '').replace(' CS', '');
  const pct = Math.round((delivery.progress || 0) * 100);
  const remHours = 4 * (1 - (delivery.progress || 0));
  const hours = Math.floor(remHours);
  const mins = Math.round((remHours - hours) * 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-[52px] left-6 z-[3000] w-[320px] bg-[var(--bg-surface)] border border-[var(--amber)] rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
    >
      <div className="bg-[var(--amber)] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-mono text-xs font-bold text-white uppercase tracking-widest">⇄ Lateral Transfer Active</div>
          <div className="font-body text-sm text-white mt-0.5 font-semibold">{fromName} → {toName}</div>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white"><X size={16} /></button>
      </div>
      <div className="p-4 space-y-3">
        <div className="font-body text-xs text-[var(--text-secondary)] leading-relaxed">
          HQ fleet exhausted or no direct route. <strong>LateralTransferAgent</strong> identified surplus at{' '}
          <strong>{fromName}</strong> and authorized emergency CS→CS dispatch.
        </div>
        <div className="flex gap-2 text-xs font-mono">
          <span className="bg-[#FFF8E1] text-[var(--amber)] px-2 py-0.5 rounded capitalize">
            {(delivery.product || '').replace('_', ' ')}
          </span>
          <span className="bg-[var(--bg-elevated)] text-[var(--navy)] px-2 py-0.5 rounded">
            ×{Math.round(delivery.quantity || 0)} units
          </span>
          <span className={`px-2 py-0.5 rounded font-bold ${
            delivery.urgency === 'critical' ? 'bg-[var(--critical)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--navy)]'
          }`}>{(delivery.urgency || 'normal').toUpperCase()}</span>
        </div>
        <div>
          <div className="flex justify-between font-mono text-[10px] text-[var(--text-secondary)] mb-1">
            <span>Progress: {pct}%</span>
            <span>ETA: ~{hours}h {mins}m</span>
          </div>
          <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--amber)] rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex justify-between font-mono text-[10px] text-[var(--text-secondary)] border-t border-[var(--border)] pt-2">
          <span>Agent: LATERAL_TRANSFER</span>
          <span>Conf: 85%</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── HQ Icon with fleet arc (Fix 9) ───────────────────────────
function createHqIcon(hqId, trucks, exhausted) {
  const total = trucks?.total || 1;
  const available = trucks?.available ?? total;
  const deployed = total - available;
  const fraction = deployed / total;
  const animClass = exhausted ? 'rapid-flash' : 'pulse-ring';

  // SVG arc: sweep from -135° to +135° (270° range) proportional to fraction
  const r = 14;
  const cx = 16; const cy = 16;
  const toRad = d => (d * Math.PI) / 180;
  const startAngle = -135;
  const sweepAngle = 270 * fraction;
  const endAngle = startAngle + sweepAngle;

  const arcPath = sweepAngle > 0 ? (() => {
    const sa = toRad(startAngle);
    const ea = toRad(endAngle);
    const x1 = cx + r * Math.cos(sa); const y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea); const y2 = cy + r * Math.sin(ea);
    const large = sweepAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  })() : '';

  const arcColor = exhausted ? '#C4873A' : '#1A3C5E';
  const label = (HQ_NODES[hqId]?.name || hqId).replace(' HQ', '');

  const html = `
    <div style="position:relative;width:32px;height:32px;">
      <svg width="32" height="32" style="position:absolute;top:0;left:0;">
        ${arcPath ? `<path d="${arcPath}" stroke="${arcColor}" stroke-width="3" fill="none" stroke-linecap="round" ${exhausted ? 'opacity="0.9"' : 'opacity="0.7"'}/>` : ''}
      </svg>
      <div class="hq-marker ${animClass}" style="position:absolute;top:4px;left:4px;width:24px;height:24px;"></div>
    </div>
    <div style="margin-top:2px;font-family:monospace;font-size:8px;color:#1A3C5E;background:rgba(255,255,255,0.9);padding:1px 3px;border-radius:2px;white-space:nowrap;text-align:center;transform:translateX(-25%);">
      ${label} ${available}/${total}
    </div>`;

  return L.divIcon({ html, className: '', iconSize: [32, 48], iconAnchor: [16, 16] });
}

// ── CS marker icon ───────────────────────────────────────────
function createCsIcon(csId, health) {
  const cls = health === 'critical' ? 'status-critical' :
              health === 'warning' ? 'status-warning' :
              health === 'disrupted' ? 'status-disrupted' : 'status-success';
  return L.divIcon({
    html: `<div class="cs-marker ${cls}"></div>`,
    className: '', iconSize: [18, 18], iconAnchor: [9, 9]
  });
}

// ── Blocked road midpoint ✕ marker ───────────────────────────
function createBlockedMarker() {
  return L.divIcon({
    html: `<div style="font-size:14px;color:#B83232;animation:sonar-ping 1.5s infinite;text-shadow:0 0 4px rgba(184,50,50,0.6);">✕</div>`,
    className: '', iconSize: [16, 16], iconAnchor: [8, 8]
  });
}

// ── Vehicle chevron icon ─────────────────────────────────────
function createChevronIcon(angle, urgency) {
  const color = urgency === 'critical' ? '#B83232' : urgency === 'important' ? '#C4873A' : '#FFFFFF';
  const html = `<div style="transform:rotate(${angle}deg) scale(1.5);">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="${color}" stroke="#1A3C5E" stroke-width="2">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  </div>`;
  return L.divIcon({ html, className: '', iconSize: [12, 12], iconAnchor: [6, 6] });
}

// ── Main Component ────────────────────────────────────────────
export default function NationalMapLayer() {
  const { coldStores, hqTrucks, deliveries, blockedRoads, disruptionsActive, decisions } = useWebSocket();
  const { currentLayer, selectedCorridor, selectedCsId, navigateToCorridor, navigateToColdStore } = useLayer();

  const [commandRailOpen, setCommandRailOpen] = useState(false);
  const [blockRoadMode, setBlockRoadMode] = useState(false);
  const [activeLateralDelivery, setActiveLateralDelivery] = useState(null); // Fix 1

  const blockedSet = useMemo(() =>
    new Set((blockedRoads || []).map(br => `${br[0]}|${br[1]}|${br[2]}`)),
    [blockedRoads]
  );

  // Build corridors from roads dict
  const corridors = useMemo(() => {
    const roadsDict = getRoadsSync();
    const result = [];
    Object.keys(roadsDict).forEach(key => {
      const [fromId, toId] = key.split('-');
      const fromNode = HQ_NODES[fromId] || CS_NODES[fromId];
      const toNode = CS_NODES[toId] || HQ_NODES[toId];
      if (fromNode && toNode) {
        result.push({ id: key, from: fromNode, to: toNode, routes: roadsDict[key] });
      }
    });

    // Add dynamic lateral corridors
    const lateralDeliveries = (deliveries || []).filter(d => d?.from?.startsWith('CS_') && d?.to?.startsWith('CS_'));
    const lateralPairs = new Set();
    lateralDeliveries.forEach(d => {
      const pair = [d.from, d.to].sort().join('-');
      if (!lateralPairs.has(pair) && CS_NODES[d.from] && CS_NODES[d.to]) {
        lateralPairs.add(pair);
        result.push({ id: pair, from: CS_NODES[d.from], to: CS_NODES[d.to], routes: [{ route_name: 'Lateral Route', distance: 0, time: 0, risk: 0 }] });
      }
    });

    return result;
  }, [deliveries]);

  const isMapInteractive = currentLayer === 'national';

  return (
    <div className="w-full h-full relative">
      <CommandBar onToggleCommandRail={() => setCommandRailOpen(!commandRailOpen)} blockRoadMode={blockRoadMode} setBlockRoadMode={setBlockRoadMode} />
      <Breadcrumb />

      {/* Fix 2: Road Block Panel */}
      <RoadBlockPanel isOpen={blockRoadMode} onClose={() => setBlockRoadMode(false)} />

      {/* Fix 1: Lateral Transfer Panel */}
      <AnimatePresence>
        {activeLateralDelivery && (
          <LateralPanel
            delivery={activeLateralDelivery}
            onClose={() => setActiveLateralDelivery(null)}
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-0 pt-[52px] pb-[32px]">
        <MapContainer
          center={[20.5, 78.9]} zoom={5} scrollWheelZoom={false}
          dragging={isMapInteractive} doubleClickZoom={isMapInteractive}
          zoomControl={false} className="w-full h-full z-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* ── Corridors ── */}
          {corridors.map(corr => {
            const isLateral = corr.from.id.startsWith('CS_') && corr.to.id.startsWith('CS_');
            const isSelected = selectedCorridor &&
              ((selectedCorridor.fromNode === corr.from.id && selectedCorridor.toNode === corr.to.id) ||
               (selectedCorridor.fromNode === corr.to.id && selectedCorridor.toNode === corr.from.id));

            return (
              <React.Fragment key={corr.id}>
                {(Array.isArray(corr.routes) ? corr.routes : []).map((r, idx) => {
                  const rName = typeof r === 'string' ? r : r?.route_name;
                  if (!rName) return null;

                  const blocked = blockedSet.has(`${corr.from.id}|${corr.to.id}|${rName}`) ||
                                  blockedSet.has(`${corr.to.id}|${corr.from.id}|${rName}`);

                  // Vehicles on this route (Fix 6)
                  const routeDeliveries = (deliveries || []).filter(d => d &&
                    ((d.from === corr.from.id && d.to === corr.to.id) || (d.to === corr.from.id && d.from === corr.to.id))
                  );
                  const isActive = routeDeliveries.length > 0;

                  let color = blocked ? 'var(--critical)' : isActive ? 'var(--navy)' : 'var(--success)';
                  if (isLateral) color = 'var(--amber)';
                  const weight = isActive ? 5 : isLateral ? 2.5 : 3;
                  let opacity = isActive ? 1.0 : 0.4;
                  const dashArray = (blocked || isLateral) ? '8, 8' : undefined;

                  // Fade for coldstore view
                  let isFaded = false;
                  if (currentLayer === 'coldstore' && selectedCsId) {
                    if (corr.from.id !== selectedCsId && corr.to.id !== selectedCsId) isFaded = true;
                  }
                  if (isFaded) opacity = 0.05;
                  else if (!isActive && !isSelected) opacity = 0.35;

                  const baseGeometry = r?.geometry || [[corr.from.lat, corr.from.lng], [corr.to.lat, corr.to.lng]];
                  const offsetMag = 0.08;
                  const mult = corr.routes.length === 1 ? 0 : idx - (corr.routes.length - 1) / 2;
                  const finalGeometry = offsetPolyline(baseGeometry, offsetMag * mult);

                  // Midpoint for blocked ✕ marker (Fix 3)
                  const midIdx = Math.floor(finalGeometry.length / 2);
                  const midPoint = finalGeometry[midIdx] || finalGeometry[0];

                  // Vehicle chevron markers (Fix 6)
                  const vehicleMarkers = !isFaded ? routeDeliveries.map(d => {
                    if (!d || d.progress == null) return null;
                    const isReverse = d.from === corr.to.id;
                    const pathProgress = isReverse ? (1 - d.progress) : d.progress;
                    const vPoint = getPointAlongPath(finalGeometry, pathProgress);
                    if (!vPoint) return null;
                    let angle = getAngleAlongPath(finalGeometry, pathProgress);
                    if (isReverse) angle += 180;
                    const remHours = (4 * (1 - d.progress)).toFixed(1);
                    const h = Math.floor(remHours); const m = Math.round((remHours - h) * 60);
                    const icon = createChevronIcon(angle, d.urgency);

                    return (
                      <Marker key={d.id} position={vPoint} icon={icon}>
                        <LTooltip direction="top" offset={[0, -10]} opacity={1}>
                          <div className="font-body text-xs bg-[var(--bg-surface)] p-2 rounded shadow border border-[var(--border)] text-[var(--navy)]">
                            <div className="font-mono font-bold mb-1">Vehicle {(d.id || '').substring(0, 8)}</div>
                            <div>{(d.from || '').replace('HQ_', '').replace('CS_', '')} → {(d.to || '').replace('HQ_', '').replace('CS_', '')}</div>
                            <div>Cargo: <span className="capitalize">{(d.product || '').replace('_', ' ')}</span> ×{Math.round(d.quantity || 0)}</div>
                            <div className="text-[10px] text-[var(--text-secondary)] mt-1">ETA: {h}h {m}m · {d.urgency}</div>
                          </div>
                        </LTooltip>
                      </Marker>
                    );
                  }).filter(Boolean) : [];

                  return (
                    <React.Fragment key={rName + idx}>
                      <Polyline
                        positions={finalGeometry}
                        pathOptions={{ color, weight, opacity, dashArray }}
                        eventHandlers={{
                          click: () => {
                            if (isLateral) {
                              // Fix 1: open lateral panel
                              const latDelivery = routeDeliveries[0] || null;
                              setActiveLateralDelivery(latDelivery);
                            } else if (!isFaded && isMapInteractive) {
                              navigateToCorridor(corr.from.id, corr.to.id);
                            }
                          }
                        }}
                      />
                      {/* Fix 3: blocked midpoint ✕ marker */}
                      {blocked && midPoint && (
                        <Marker position={midPoint} icon={createBlockedMarker()} />
                      )}
                      {vehicleMarkers}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* ── HQ Markers (Fix 9: fleet arc) ── */}
          {Object.values(HQ_NODES).map(hq => {
            const trucks = hqTrucks[hq.id] || { available: hq.total_trucks, total: hq.total_trucks };
            const exhausted = trucks.total > 0 && trucks.available === 0;
            let isFaded = false;
            if (currentLayer === 'coldstore' && selectedCsId) {
              const connectedCorridors = corridors.filter(c => c.from.id === selectedCsId || c.to.id === selectedCsId);
              if (!connectedCorridors.some(c => c.from.id === hq.id || c.to.id === hq.id)) isFaded = true;
            }
            const lastDispatch = (decisions || []).find(d => d?.agent_type === 'transportation' && d?.action?.includes('DISPATCH') && d?.cs_id === hq.id);
            const timeStr = lastDispatch ? new Date(lastDispatch.timestamp).toLocaleTimeString() : 'N/A';

            return (
              <Marker key={hq.id} position={[hq.lat, hq.lng]} icon={createHqIcon(hq.id, trucks, exhausted)} opacity={isFaded ? 0.1 : 1}>
                {!isFaded && (
                  <LTooltip direction="top" offset={[0, -20]} opacity={1} className="custom-hq-tooltip">
                    <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-3 shadow-lg w-[200px] font-body rounded">
                      <div className="font-display text-[var(--navy)] text-sm mb-1">{hq.name}</div>
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">Zone: {hq.zone}</div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[var(--navy)] font-semibold">Fleet Status</span>
                        <span className="font-mono text-[10px] text-[var(--text-secondary)]">{trucks.available} / {trucks.total} avail.</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-2">
                        <div className={`h-full transition-all ${exhausted ? 'bg-[var(--amber)]' : 'bg-[var(--navy)]'}`}
                          style={{ width: `${trucks.total ? ((trucks.total - trucks.available) / trucks.total) * 100 : 0}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[var(--text-secondary)]">Last Dispatch:</span>
                        <span className="font-mono text-[var(--navy)]">{timeStr}</span>
                      </div>
                    </div>
                  </LTooltip>
                )}
              </Marker>
            );
          })}

          {/* ── CS Markers ── */}
          {Object.values(CS_NODES).map(cs => {
            let isFaded = currentLayer === 'coldstore' && selectedCsId && cs.id !== selectedCsId;
            const stocks = coldStores[cs.id] || {};
            let lowestPct = 100;
            Object.values(stocks).forEach(v => { const p = (v / 100) * 100; if (p < lowestPct) lowestPct = p; });
            let health = lowestPct < 30 ? 'critical' : lowestPct < 60 ? 'warning' : 'success';
            if (disruptionsActive[cs.id]?.cold_chain_failed) health = 'disrupted';

            return (
              <Marker
                key={cs.id}
                position={[cs.lat, cs.lng]}
                icon={createCsIcon(cs.id, health)}
                opacity={isFaded ? 0.1 : 1}
                eventHandlers={{ click: () => { if (!blockRoadMode && isMapInteractive) navigateToColdStore(cs.id); } }}
              />
            );
          })}

          <ParticleOverlay corridors={corridors} deliveries={deliveries || []} />
        </MapContainer>
      </div>

      <BottomTicker />
      <CommandRail isOpen={commandRailOpen} onClose={() => setCommandRailOpen(false)} setBlockRoadMode={setBlockRoadMode} />
    </div>
  );
}

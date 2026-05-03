import { useEffect, useRef } from 'react'

const AGENT_COLORS = {
  inventory: '#00d4ff',
  demand_forecast: '#f0a500',
  supplier: '#00ff88',
  transportation: '#9966ff',
  lateral_transfer: '#ff69b4',
  alert: '#ff3355',
}

export default function AgentDecisionFeed({ decisions }) {
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [decisions])

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      <h3 className="text-xs text-cyan-400 uppercase tracking-wider font-bold mb-2">Decision Feed</h3>
      {decisions.length === 0 && <p className="text-gray-500 text-xs">Waiting for agent activity...</p>}
      {decisions.map((d, i) => {
        const color = AGENT_COLORS[d.agent_type] || '#ffffff44'
        return (
          <div key={i} className="bg-gray-900 rounded p-2 text-xs border border-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-semibold">{d.warehouse_id || d.agent_id}</span>
              <span className="text-gray-500 text-[10px]">{new Date(d.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center mt-1 gap-2">
              <span className="text-[10px] px-1 rounded" style={{ backgroundColor: `${color}33`, color }}>
                {d.agent_type?.toUpperCase()}
              </span>
              <span className="text-white">{d.decision?.replace(/_/g, ' ')}</span>
            </div>
            {d.reasoning && <div className="text-gray-500 mt-0.5 italic">{d.reasoning}</div>}
            {d.confidence_score && (
              <div className="mt-1 flex items-center gap-1">
                <div className="w-12 bg-gray-700 rounded-full h-1">
                  <div className="bg-cyan-400 h-1 rounded-full" style={{ width: `${d.confidence_score * 100}%` }} />
                </div>
                <span className="text-[10px] text-gray-400">{Math.round(d.confidence_score * 100)}%</span>
              </div>
            )}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
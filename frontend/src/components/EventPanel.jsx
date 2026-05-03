export default function EventPanel({ events }) {
  const active = events.filter(e => e.status === 'active')
  return (
    <div className="p-3 border-t border-gray-800 max-h-48 overflow-y-auto">
      <h3 className="text-xs text-red-400 uppercase tracking-wider font-bold mb-2">Active Events</h3>
      {active.length === 0 && <p className="text-gray-500 text-xs">No active events.</p>}
      {active.map((e, i) => (
        <div key={i} className="bg-red-900/30 rounded p-2 text-xs mb-2 border border-red-800">
          <div className="flex justify-between">
            <span className="text-red-300 font-bold">{e.type}</span>
            <span className="text-gray-400">{e.severity}</span>
          </div>
          <div className="text-gray-300 mt-0.5">{e.description}</div>
          {e.affected_states && <div className="text-gray-500 mt-0.5">States: {e.affected_states.join(', ')}</div>}
        </div>
      ))}
    </div>
  )
}
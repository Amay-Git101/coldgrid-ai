import { useState } from 'react'

export default function DemoControlPanel() {
  const [loading, setLoading] = useState(false)

  const triggerEvent = async (type) => {
    setLoading(true)
    try {
      await fetch('http://localhost:8000/api/demo/trigger-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: type }),
      })
    } catch (err) {
      console.error('Failed to trigger event', err)
    } finally {
      setLoading(false)
    }
  }

  const reset = async () => {
    await fetch('http://localhost:8000/api/demo/reset', { method: 'POST' })
  }

  return (
    <div className="p-3 border-t border-gray-800">
      <h3 className="text-xs text-cyan-400 uppercase tracking-wider font-bold mb-2">Demo Controls</h3>
      <div className="grid grid-cols-2 gap-1">
        <button onClick={() => triggerEvent('cyclone')} disabled={loading} className="bg-gray-800 hover:bg-gray-700 text-xs p-1.5 rounded disabled:opacity-50">🌀 Cyclone</button>
        <button onClick={() => triggerEvent('festival')} disabled={loading} className="bg-gray-800 hover:bg-gray-700 text-xs p-1.5 rounded disabled:opacity-50">🎉 Festival</button>
        <button onClick={() => triggerEvent('power_outage')} disabled={loading} className="bg-gray-800 hover:bg-gray-700 text-xs p-1.5 rounded disabled:opacity-50">⚡ Power Outage</button>
        <button onClick={() => triggerEvent('supplier')} disabled={loading} className="bg-gray-800 hover:bg-gray-700 text-xs p-1.5 rounded disabled:opacity-50">🏭 Supplier Fail</button>
        <button onClick={() => triggerEvent('heatwave')} disabled={loading} className="bg-gray-800 hover:bg-gray-700 text-xs p-1.5 rounded disabled:opacity-50">🔥 Heatwave</button>
        <button onClick={reset} className="bg-red-900 hover:bg-red-800 text-xs p-1.5 rounded">🔄 Reset</button>
      </div>
    </div>
  )
}
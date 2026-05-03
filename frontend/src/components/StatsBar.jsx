import useStore from '../store/useStore'

export default function StatsBar() {
  const { decisions, deliveries, connected, warehouses } = useStore()
  const activeDeliveries = deliveries.filter(d => d.status === 'on_road').length
  const totalAgents = Object.keys(warehouses).length

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-gray-900/90 border-b border-gray-800 text-xs">
      <span className="text-gray-400 uppercase tracking-wider font-bold text-[10px]">System Status</span>
      <div className="flex items-center gap-1">
        <span className="text-green-400 font-bold">{totalAgents}</span>
        <span className="text-gray-500">cold stores</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-cyan-400 font-bold">{decisions.length}</span>
        <span className="text-gray-500">decisions</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-yellow-400 font-bold">{activeDeliveries}</span>
        <span className="text-gray-500">active deliveries</span>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 shadow-lg shadow-green-500/50' : 'bg-red-500'}`} />
        <span className="text-gray-400">{connected ? 'LIVE' : 'OFFLINE'}</span>
      </div>
    </div>
  )
}
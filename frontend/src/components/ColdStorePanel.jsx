import useStore from '../store/useStore'
import { PRODUCTS } from '../constants/products'

export default function ColdStorePanel({ csId, onClose }) {
  const { warehouses, deliveries, decisions } = useStore()
  const stock = warehouses[csId] || {}
  const csDeliveries = deliveries.filter(d => d.to === csId && d.status !== 'arrived')
  const csDecisions = decisions.filter(d => d.warehouse_id === csId).slice(0, 10)

  // Disruption actions
  const handleDrain = async (product) => {
    await fetch(`http://localhost:8000/judge/drain-stock?cs_id=${csId}&product=${product}`, { method: 'POST' })
  }
  const handleFlood = async (product, amount = 100) => {
    await fetch(`http://localhost:8000/judge/flood-stock?cs_id=${csId}&product=${product}&amount=${amount}`, { method: 'POST' })
  }
  const handleSpike = async () => {
    await fetch(`http://localhost:8000/judge/spike-demand?cs_id=${csId}`, { method: 'POST' })
  }
  const handleColdChainFail = async () => {
    await fetch(`http://localhost:8000/judge/cold-chain-failure?cs_id=${csId}`, { method: 'POST' })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-cyan-400 font-bold text-sm uppercase tracking-wide">{csId}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
      </div>
      <div className="p-3 space-y-4">
        {/* Stock levels */}
        <div>
          <h3 className="text-xs text-gray-400 uppercase mb-2">Stock Levels</h3>
          {Object.keys(stock).length === 0 && <p className="text-gray-500 text-xs">No data yet…</p>}
          {Object.entries(stock).map(([product, level]) => (
            <div key={product} className="mb-1">
              <div className="flex justify-between text-xs">
                <span className="capitalize">{product.replace(/_/g, ' ')}</span>
                <span className={level < 15 ? 'text-red-400' : 'text-green-400'}>{Math.floor(level)}</span>
              </div>
              <div className="w-full bg-gray-700 h-1 rounded overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all" style={{ width: `${Math.min(100, level)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Incoming deliveries */}
        <div>
          <h3 className="text-xs text-yellow-400 uppercase mb-2">Incoming Deliveries</h3>
          {csDeliveries.length === 0 && <p className="text-gray-500 text-xs">None</p>}
          {csDeliveries.map((d, i) => (
            <div key={i} className="bg-gray-800 rounded p-2 text-xs mb-1">
              <div>{d.product} ({d.quantity}t) from {d.from}</div>
              <div className="text-gray-400 mt-1">Route: {d.route?.[0]?.route_name}</div>
              <div className="text-gray-500">ETA: {d.current_step}/{d.route?.length} hops</div>
            </div>
          ))}
        </div>

        {/* Disruption tools */}
        <div>
          <h3 className="text-xs text-red-400 uppercase mb-2">Disruptions</h3>
          <div className="grid grid-cols-2 gap-1">
            {Object.keys(stock).length === 0 ? (
              <p className="text-gray-500 text-xs col-span-2">Stock data required for disruptions</p>
            ) : (
              <>
                {Object.keys(stock).slice(0, 6).map(product => (
                  <button
                    key={product}
                    onClick={() => handleDrain(product)}
                    className="bg-red-900/50 hover:bg-red-800 text-xs p-1.5 rounded"
                  >
                    Drain {product}
                  </button>
                ))}
                <button onClick={handleSpike} className="bg-orange-900/50 hover:bg-orange-800 text-xs p-1.5 rounded">
                  Spike Demand 5x
                </button>
                <button onClick={handleColdChainFail} className="bg-purple-900/50 hover:bg-purple-800 text-xs p-1.5 rounded">
                  Cold Chain Fail
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent decisions */}
        <div>
          <h3 className="text-xs text-gray-400 uppercase mb-2">Agent Decisions</h3>
          {csDecisions.length === 0 && <p className="text-gray-500 text-xs">None yet</p>}
          {csDecisions.map((d, i) => (
            <div key={i} className="bg-gray-800 rounded p-2 text-xs mb-1">
              <span className="text-cyan-300 font-bold">{d.agent_type}</span>: {d.decision}
              <div className="text-gray-500 italic">{d.reasoning}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
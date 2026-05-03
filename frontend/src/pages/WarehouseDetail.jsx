import { useParams, Link } from 'react-router-dom'
import useStore from '../store/useStore'

export default function WarehouseDetail() {
  const { id } = useParams()
  const warehouse = useStore((state) => state.warehouses[id])

  if (!warehouse) {
    return (
      <div className="p-8 text-gray-400">
        <Link to="/" className="text-cyan-400 underline">← Back</Link>
        <p className="mt-4">Warehouse not found.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/" className="text-cyan-400 underline text-sm">← Back to Dashboard</Link>
      <h1 className="text-3xl text-cyan-300 mt-4 font-bold">{id}</h1>
      <p className="text-gray-400">{warehouse.city}, {warehouse.state} · {warehouse.platform}</p>
      <div className="grid grid-cols-2 gap-4 mt-6">
        {Object.entries(warehouse.stock || {}).map(([product, level]) => (
          <div key={product} className="bg-gray-800 p-4 rounded">
            <div className="text-gray-300 capitalize text-sm">{product.replace(/_/g, ' ')}</div>
            <div className="text-2xl font-bold text-green-400">{level}%</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: `${level}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <h2 className="text-lg text-cyan-400 mb-2">Recent Agent Actions</h2>
        <div className="bg-gray-800 rounded p-4 text-gray-400 text-sm">
          (Agent decision log for this warehouse will appear here)
        </div>
      </div>
    </div>
  )
}
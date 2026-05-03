import { useState } from 'react'
import useStore from '../store/useStore'
import MapView from '../components/MapView'
import ColdStorePanel from '../components/ColdStorePanel'
import AgentDecisionFeed from '../components/AgentDecisionFeed'
import StatsBar from '../components/StatsBar'

export default function Dashboard() {
  const { warehouses, decisions, deliveries, blockedRoads, connected } = useStore()
  const [selectedColdStore, setSelectedColdStore] = useState(null)

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      <StatsBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Map occupies most space */}
        <div className="flex-1 relative">
          <MapView
            coldStores={warehouses}
            deliveries={deliveries}
            blockedRoads={blockedRoads}
            onColdStoreClick={(id) => setSelectedColdStore(id)}
          />
        </div>

        {/* Right sidebar: Cold Store Panel or Decision Feed */}
        <div className="w-96 border-l border-gray-800 flex flex-col">
          {selectedColdStore ? (
            <ColdStorePanel
              csId={selectedColdStore}
              onClose={() => setSelectedColdStore(null)}
            />
          ) : (
            <AgentDecisionFeed decisions={decisions} />
          )}
        </div>
      </div>
    </div>
  )
}
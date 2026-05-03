import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import useStore from '../store/useStore'
import { ROADS } from '../constants/roads'

const LOCATIONS = {
  "HQ_DELHI": [28.6139, 77.2090],
  "HQ_MUMBAI": [19.0760, 72.8777],
  "HQ_BANGALORE": [12.9716, 77.5946],
  "HQ_KOLKATA": [22.5726, 88.3639],
  "CS_JAIPUR": [26.9124, 75.7873],
  "CS_LUCKNOW": [26.8467, 80.9462],
  "CS_CHANDIGARH": [30.7333, 76.7794],
  "CS_INDORE": [22.7196, 75.8577],
  "CS_AHMEDABAD": [23.0225, 72.5714],
  "CS_PUNE": [18.5204, 73.8567],
  "CS_NAGPUR": [21.1458, 79.0882],
  "CS_BHOPAL": [23.2599, 77.4126],
  "CS_CHENNAI": [13.0827, 80.2707],
  "CS_HYDERABAD": [17.3850, 78.4867],
  "CS_KOCHI": [9.9312, 76.2673],
  "CS_PATNA": [25.5941, 85.1376],
  "CS_RANCHI": [23.3441, 85.3096],
  "CS_BHUBANESHWAR": [20.2961, 85.8245],
  "CS_GUWAHATI": [26.1445, 91.7362],
}

export default function MapView({ coldStores, deliveries, blockedRoads, onColdStoreClick }) {
  const mapRef = useRef(null)
  const markersRef = useRef({})
  const linesRef = useRef([])

  const blockedSet = new Set(blockedRoads.map(r => `${r[0]}|${r[1]}|${r[2]}`))

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map', {
        center: [22.0, 79.0],    // center on India
        zoom: 5.5,
        zoomControl: true,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map)

      // HQs (gold)
      Object.entries(LOCATIONS).forEach(([id, [lat, lng]]) => {
        if (id.startsWith('HQ_')) {
          const marker = L.circleMarker([lat, lng], {
            radius: 10,
            color: '#f0a500',
            fillColor: '#f0a500',
            fillOpacity: 0.9,
            weight: 2,
          }).addTo(map).bindPopup(`<b>${id}</b> (HQ)`)
          markersRef.current[id] = marker
        }
      })

      // Cold stores (cyan)
      Object.entries(LOCATIONS).forEach(([id, [lat, lng]]) => {
        if (!id.startsWith('HQ_')) {
          const marker = L.circleMarker([lat, lng], {
            radius: 7,
            color: '#00d4ff',
            fillColor: '#00d4ff',
            fillOpacity: 0.9,
            weight: 2,
          }).addTo(map)
          marker.on('click', () => onColdStoreClick(id))
          marker.bindPopup(`<b>${id}</b> (Cold Store)`)
          markersRef.current[id] = marker
        }
      })

      drawRoads(map)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (mapRef.current) {
      // Remove old lines and redraw
      linesRef.current.forEach(line => line.remove())
      linesRef.current = []
      drawRoads(mapRef.current)
    }
  }, [blockedRoads, deliveries])

  function drawRoads(map) {
    ROADS.forEach(road => {
      const fromCoords = LOCATIONS[road.from]
      const toCoords = LOCATIONS[road.to]
      if (!fromCoords || !toCoords) return
      const isBlocked = blockedSet.has(`${road.from}|${road.to}|${road.route_name}`) ||
                       blockedSet.has(`${road.to}|${road.from}|${road.route_name}`)
      const color = isBlocked ? '#ff3355' : '#00d4ff88'   // brighter cyan
      const line = L.polyline([fromCoords, toCoords], {
        color, weight: 1.8, opacity: 0.8,
      }).addTo(map)

      line.bindTooltip(`${road.route_name} (${road.from} ↔ ${road.to})`)
      line.on('click', () => {
        const url = isBlocked
          ? `http://localhost:8000/judge/unblock-road?node1=${road.from}&node2=${road.to}&route_name=${road.route_name}`
          : `http://localhost:8000/judge/block-road?node1=${road.from}&node2=${road.to}&route_name=${road.route_name}`
        fetch(url, { method: 'POST' }).catch(console.error)
      })
      linesRef.current.push(line)
    })
  }

  return <div id="map" style={{ width: '100%', height: '100%' }} />
}
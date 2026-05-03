import { judgeApi } from '../api/judgeApi';

export const HQ_NODES = {
  HQ_DELHI: { id: 'HQ_DELHI', name: 'Delhi HQ', lat: 28.6139, lng: 77.2090, zone: 'North', total_trucks: 6 },
  HQ_MUMBAI: { id: 'HQ_MUMBAI', name: 'Mumbai HQ', lat: 19.0760, lng: 72.8777, zone: 'West', total_trucks: 8 },
  HQ_BANGALORE: { id: 'HQ_BANGALORE', name: 'Bangalore HQ', lat: 12.9716, lng: 77.5946, zone: 'South', total_trucks: 7 },
  HQ_KOLKATA: { id: 'HQ_KOLKATA', name: 'Kolkata HQ', lat: 22.5726, lng: 88.3639, zone: 'East', total_trucks: 5 }
};

export const CS_NODES = {
  CS_JAIPUR:       { id: 'CS_JAIPUR',       name: 'Jaipur',      lat: 26.9124, lng: 75.7873, state: 'Rajasthan',      primary_hq: 'HQ_DELHI' },
  CS_LUCKNOW:      { id: 'CS_LUCKNOW',      name: 'Lucknow',     lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh',  primary_hq: 'HQ_DELHI' },
  CS_CHANDIGARH:   { id: 'CS_CHANDIGARH',   name: 'Chandigarh',  lat: 30.7333, lng: 76.7794, state: 'Punjab',         primary_hq: 'HQ_DELHI' },
  CS_INDORE:       { id: 'CS_INDORE',       name: 'Indore',      lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh', primary_hq: 'HQ_MUMBAI' },
  CS_AHMEDABAD:    { id: 'CS_AHMEDABAD',    name: 'Ahmedabad',   lat: 23.0225, lng: 72.5714, state: 'Gujarat',        primary_hq: 'HQ_MUMBAI' },
  CS_PUNE:         { id: 'CS_PUNE',         name: 'Pune',        lat: 18.5204, lng: 73.8567, state: 'Maharashtra',    primary_hq: 'HQ_MUMBAI' },
  CS_NAGPUR:       { id: 'CS_NAGPUR',       name: 'Nagpur',      lat: 21.1458, lng: 79.0882, state: 'Maharashtra',    primary_hq: 'HQ_MUMBAI' },
  CS_BHOPAL:       { id: 'CS_BHOPAL',       name: 'Bhopal',      lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh', primary_hq: 'HQ_MUMBAI' },
  CS_CHENNAI:      { id: 'CS_CHENNAI',      name: 'Chennai',     lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu',     primary_hq: 'HQ_BANGALORE' },
  CS_HYDERABAD:    { id: 'CS_HYDERABAD',    name: 'Hyderabad',   lat: 17.3850, lng: 78.4867, state: 'Telangana',      primary_hq: 'HQ_BANGALORE' },
  CS_KOCHI:        { id: 'CS_KOCHI',        name: 'Kochi',       lat: 9.9312,  lng: 76.2673, state: 'Kerala',         primary_hq: 'HQ_BANGALORE' },
  CS_PATNA:        { id: 'CS_PATNA',        name: 'Patna',       lat: 25.5941, lng: 85.1376, state: 'Bihar',          primary_hq: 'HQ_KOLKATA' },
  CS_RANCHI:       { id: 'CS_RANCHI',       name: 'Ranchi',      lat: 23.3441, lng: 85.3096, state: 'Jharkhand',      primary_hq: 'HQ_KOLKATA' },
  CS_BHUBANESHWAR: { id: 'CS_BHUBANESHWAR', name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, state: 'Odisha',         primary_hq: 'HQ_KOLKATA' },
  CS_GUWAHATI:     { id: 'CS_GUWAHATI',     name: 'Guwahati',    lat: 26.1445, lng: 91.7362, state: 'Assam',          primary_hq: 'HQ_KOLKATA' },
};

export const PRODUCTS = [
  'dairy', 'meat', 'seafood', 'frozen_meals', 'medicine',
  'ice_cream', 'beverages', 'vegetables', 'eggs', 'bakery'
];

// Keys MUST be sorted alphabetically (same as getRoads() runtime key generation: [from,to].sort().join('-'))
export const FALLBACK_ROADS = {
  // HQ → CS routes (key = sorted([hqId, csId]))
  "CS_CHANDIGARH-HQ_DELHI":   [{ route_name: 'NH-44',      distance: 250, time: 3.8,  risk: 0.10 }, { route_name: 'SH-7',       distance: 270, time: 4.2,  risk: 0.25 }, { route_name: 'Link Road',  distance: 300, time: 5.0,  risk: 0.35 }],
  "CS_JAIPUR-HQ_DELHI":       [{ route_name: 'NH-48',      distance: 280, time: 4.5,  risk: 0.20 }, { route_name: 'SH-12',      distance: 310, time: 5.0,  risk: 0.30 }, { route_name: 'Link Road',  distance: 350, time: 5.8,  risk: 0.40 }],
  "CS_LUCKNOW-HQ_DELHI":      [{ route_name: 'NH-48',      distance: 450, time: 7.0,  risk: 0.30 }, { route_name: 'NH-30',      distance: 480, time: 7.5,  risk: 0.35 }, { route_name: 'SH-25',     distance: 520, time: 8.2,  risk: 0.40 }],
  "CS_AHMEDABAD-HQ_MUMBAI":   [{ route_name: 'NH-48',      distance: 540, time: 8.5,  risk: 0.30 }, { route_name: 'NH-8 Express', distance: 500, time: 7.8, risk: 0.25 }, { route_name: 'SH-50',     distance: 580, time: 9.2,  risk: 0.40 }],
  "CS_BHOPAL-HQ_MUMBAI":      [{ route_name: 'NH-46',      distance: 780, time: 11.0, risk: 0.40 }, { route_name: 'SH-18',      distance: 810, time: 11.8, risk: 0.45 }, { route_name: 'Link Corridor', distance: 840, time: 12.5, risk: 0.50 }],
  "CS_INDORE-HQ_MUMBAI":      [{ route_name: 'NH-52',      distance: 580, time: 9.0,  risk: 0.35 }, { route_name: 'SH-31',      distance: 620, time: 9.8,  risk: 0.40 }, { route_name: 'Link Route', distance: 660, time: 10.5, risk: 0.45 }],
  "CS_NAGPUR-HQ_MUMBAI":      [{ route_name: 'NH-44',      distance: 840, time: 12.5, risk: 0.30 }, { route_name: 'SH-266',     distance: 880, time: 13.2, risk: 0.45 }, { route_name: 'Via Aurangabad', distance: 920, time: 14.0, risk: 0.50 }],
  "CS_PUNE-HQ_MUMBAI":        [{ route_name: 'Expressway', distance: 150, time: 2.5,  risk: 0.15 }, { route_name: 'NH-48',      distance: 160, time: 2.8,  risk: 0.20 }, { route_name: 'Old Pass',   distance: 190, time: 3.5,  risk: 0.40 }],
  "CS_CHENNAI-HQ_BANGALORE":  [{ route_name: 'NH-48',      distance: 350, time: 5.5,  risk: 0.20 }, { route_name: 'SH-4',       distance: 380, time: 6.0,  risk: 0.30 }, { route_name: 'Express Route', distance: 330, time: 5.0, risk: 0.25 }],
  "CS_HYDERABAD-HQ_BANGALORE":[{ route_name: 'NH-44',      distance: 570, time: 8.0,  risk: 0.30 }, { route_name: 'SH-20',      distance: 600, time: 8.5,  risk: 0.35 }, { route_name: 'Link Road', distance: 630, time: 9.2,  risk: 0.45 }],
  "CS_KOCHI-HQ_BANGALORE":    [{ route_name: 'NH-66',      distance: 540, time: 9.0,  risk: 0.40 }, { route_name: 'SH-17',      distance: 580, time: 9.8,  risk: 0.45 }, { route_name: 'Coastal Route', distance: 620, time: 10.5, risk: 0.50 }],
  "CS_BHUBANESHWAR-HQ_KOLKATA":[{ route_name: 'NH-16',     distance: 450, time: 7.0,  risk: 0.30 }, { route_name: 'SH-60',      distance: 480, time: 7.5,  risk: 0.40 }, { route_name: 'Coastal Road', distance: 510, time: 8.0, risk: 0.45 }],
  "CS_GUWAHATI-HQ_KOLKATA":   [{ route_name: 'NH-27',      distance: 1030,time: 16.0, risk: 0.50 }, { route_name: 'NH-17',      distance: 1080,time: 17.0, risk: 0.55 }, { route_name: 'Siliguri Pass', distance: 1120, time: 18.5, risk: 0.60 }],
  "CS_PATNA-HQ_KOLKATA":      [{ route_name: 'NH-19',      distance: 580, time: 9.0,  risk: 0.35 }, { route_name: 'SH-78',      distance: 610, time: 9.5,  risk: 0.40 }, { route_name: 'Alternate NH', distance: 640, time: 10.0, risk: 0.50 }],
  "CS_RANCHI-HQ_KOLKATA":     [{ route_name: 'NH-33',      distance: 420, time: 6.5,  risk: 0.30 }, { route_name: 'SH-5',       distance: 450, time: 7.0,  risk: 0.40 }, { route_name: 'Link Road',  distance: 480, time: 7.5,  risk: 0.45 }],
  // CS → CS lateral routes
  "CS_CHENNAI-CS_HYDERABAD":  [{ route_name: 'NH-65',      distance: 625, time: 9.5,  risk: 0.40 }],
  "CS_AHMEDABAD-CS_JAIPUR":   [{ route_name: 'NH-48',      distance: 670, time: 10.0, risk: 0.30 }],
  "CS_BHOPAL-CS_NAGPUR":      [{ route_name: 'NH-46',      distance: 350, time: 5.5,  risk: 0.30 }, { route_name: 'SH-20', distance: 380, time: 6.0, risk: 0.35 }],
  "CS_LUCKNOW-CS_PATNA":      [{ route_name: 'NH-30',      distance: 380, time: 6.0,  risk: 0.40 }],
  "CS_BHUBANESHWAR-CS_RANCHI":[{ route_name: 'SH-9',       distance: 600, time: 10.0, risk: 0.50 }],
  "CS_NAGPUR-CS_PUNE":        [{ route_name: 'NH-44',      distance: 500, time: 8.0,  risk: 0.35 }, { route_name: 'SH-5', distance: 540, time: 8.5, risk: 0.40 }],
  "CS_AHMEDABAD-CS_INDORE":   [{ route_name: 'NH-52',      distance: 380, time: 6.0,  risk: 0.30 }],
};

let LIVE_ROADS = null;

// Cache geometries locally so we don't blast OSRM API
export const getOsrmGeometry = async (fromLat, fromLng, toLat, toLng) => {
  const cacheKey = `osrm_${fromLat}_${fromLng}_${toLat}_${toLng}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=simplified&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok') {
      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      localStorage.setItem(cacheKey, JSON.stringify(coords));
      return coords;
    }
  } catch (e) { console.warn('OSRM fetch failed, using straight line fallback', e); }
  return [[fromLat, fromLng], [toLat, toLng]];
};

export const getRoads = async () => {
  if (LIVE_ROADS) return LIVE_ROADS;
  try {
    const data = await judgeApi.getRoads();
    if (data && Array.isArray(data.roads)) {
      const transformed = {};
      
      const ALL_NODES = { ...HQ_NODES, ...CS_NODES };

      for (const r of data.roads) {
        const key = [r.from, r.to].sort().join('-');
        if (!transformed[key]) transformed[key] = [];
        
        // Add real geometry to the route object
        const n1 = ALL_NODES[r.from];
        const n2 = ALL_NODES[r.to];
        if (n1 && n2 && !r.geometry) {
           r.geometry = await getOsrmGeometry(n1.lat, n1.lng, n2.lat, n2.lng);
           // small delay to prevent 429 Too Many Requests
           await new Promise(resolve => setTimeout(resolve, 200)); 
        }

        transformed[key].push(r);
      }
      LIVE_ROADS = transformed;
    } else {
      LIVE_ROADS = FALLBACK_ROADS;
    }
  } catch (err) {
    console.error("Failed to fetch roads from API, using fallback", err);
    LIVE_ROADS = FALLBACK_ROADS;
  }
  return LIVE_ROADS;
};

export const getRoadsSync = () => {
  return LIVE_ROADS || FALLBACK_ROADS;
};

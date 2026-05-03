const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const fetchWithThrow = async (url, options) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      let errorMsg;
      try {
        const body = await response.json();
        errorMsg = body.error || body.detail || response.statusText;
      } catch (e) {
        errorMsg = response.statusText;
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  } catch (error) {
    console.error('Judge API Error:', error);
    throw error;
  }
};

export const judgeApi = {
  drainStock: async (cs_id, product) => {
    const params = new URLSearchParams({ cs_id, product });
    return fetchWithThrow(`${API_URL}/judge/drain-stock?${params.toString()}`, { method: 'POST' });
  },

  floodStock: async (cs_id, product, quantity) => {
    const params = new URLSearchParams({ cs_id, product, quantity });
    return fetchWithThrow(`${API_URL}/judge/flood-stock?${params.toString()}`, { method: 'POST' });
  },

  spikeDemand: async (cs_id, multiplier) => {
    const params = new URLSearchParams({ cs_id, multiplier });
    return fetchWithThrow(`${API_URL}/judge/spike-demand?${params.toString()}`, { method: 'POST' });
  },

  blockRoadMode: async (enabled) => {
    return fetchWithThrow(`${API_URL}/judge/block-road-mode?enabled=${enabled}`, { method: 'POST' });
  },

  blockRoad: async (node1, node2, route_name) => {
    const params = new URLSearchParams({ node1, node2, route_name });
    return fetchWithThrow(`${API_URL}/judge/block-road?${params.toString()}`, { method: 'POST' });
  },

  unblockRoad: async (node1, node2, route_name) => {
    const params = new URLSearchParams({ node1, node2, route_name });
    return fetchWithThrow(`${API_URL}/judge/unblock-road?${params.toString()}`, { method: 'POST' });
  },

  coldChainFailure: async (cs_id) => {
    const params = new URLSearchParams({ cs_id });
    return fetchWithThrow(`${API_URL}/judge/cold-chain-failure?${params.toString()}`, { method: 'POST' });
  },

  restoreColdChain: async (cs_id) => {
    const params = new URLSearchParams({ cs_id });
    return fetchWithThrow(`${API_URL}/judge/restore-cold-chain?${params.toString()}`, { method: 'POST' });
  },

  getRoads: async () => {
    return fetchWithThrow(`${API_URL}/api/roads`, { method: 'GET' });
  }
};

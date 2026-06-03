const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://nowherenest-backend.onrender.com/api';

const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  auth: {
    login: (credentials) => fetchWithAuth('/auth/login', { method: 'POST', body: credentials }),
    getMe: () => fetchWithAuth('/auth/me'),
  },
  admin: {
    getStats: () => fetchWithAuth('/admin/stats'),
    updateCommissionRate: (rate) => fetchWithAuth('/admin/commission', { method: 'PUT', body: { rate } }),

    // Host Management
    getHosts: (phone = '') => {
      const params = new URLSearchParams();
      if (phone && phone.trim()) params.append('phone', phone.trim());
      return fetchWithAuth(`/admin/hosts${params.toString() ? '?' + params.toString() : ''}`);
    },
    verifyHost: (id, licenseId) => fetchWithAuth(`/admin/hosts/${id}/verify`, { method: 'PUT', body: { licenseId } }),
    toggleNestPartner: (id) => fetchWithAuth(`/admin/hosts/${id}/nest-partner`, { method: 'PUT' }),
    addVibeCredits: (id, credits) => fetchWithAuth(`/admin/hosts/${id}/vibe-credits`, { method: 'POST', body: { credits } }),

    // Property Management
    getProperties: () => fetchWithAuth('/admin/properties'),
    licenseProperty: (id, licenseNumber) => fetchWithAuth(`/admin/properties/${id}/license`, { method: 'PUT', body: { licenseNumber } }),

    // Region Stats
    getRegionStats: () => fetchWithAuth('/admin/region-stats'),

    // Vibe Queue
    getPendingVibes: () => fetchWithAuth('/admin/vibes/pending'),
    verifyVibe: (id) => fetchWithAuth(`/admin/vibes/${id}/verify`, { method: 'PUT' }),
    rejectVibe: (id, reason) => fetchWithAuth(`/admin/vibes/${id}/reject`, { method: 'PUT', body: { reason } }),
  },
  payouts: {
    getAll: () => fetchWithAuth('/payouts'),
    updateStatus: (id, status) => fetchWithAuth(`/payouts/${id}/status`, { method: 'PUT', body: { status } }),
  },
  channel: {
    getDashboard: () => fetchWithAuth('/channel/dashboard'),
    simulateSync: (propertyId, roomId) => fetchWithAuth('/channel/sync', { method: 'POST', body: { propertyId, roomId } }),
    updateRoomInventory: (roomId, totalInventory, maintenanceBlocks) =>
      fetchWithAuth(`/channel/rooms/${roomId}/inventory`, { method: 'PUT', body: { totalInventory, maintenanceBlocks } }),
  },
  // Generic GET helper for the admin app
  get: (endpoint) => fetchWithAuth(endpoint),
};

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
    getHosts: () => fetchWithAuth('/admin/hosts'),
    verifyHost: (id, licenseId) => fetchWithAuth(`/admin/hosts/${id}/verify`, { method: 'PUT', body: { licenseId } }),
    getProperties: () => fetchWithAuth('/admin/properties'),
    licenseProperty: (id, licenseNumber) => fetchWithAuth(`/admin/properties/${id}/license`, { method: 'PUT', body: { licenseNumber } }),
  },
  payouts: {
    getAll: () => fetchWithAuth('/payouts'),
    updateStatus: (id, status) => fetchWithAuth(`/payouts/${id}/status`, { method: 'PUT', body: { status } }),
  }
};

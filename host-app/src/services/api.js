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
  // Auth API
  auth: {
    getMe: () => fetchWithAuth('/auth/me'),
    updateProfile: (profileData) => fetchWithAuth('/auth/profile', { method: 'PUT', body: profileData }),
    updateBank: (bankData) => fetchWithAuth('/auth/bank', { method: 'PUT', body: bankData }),
  },

  // Properties API
  properties: {
    create: (propertyData) => fetchWithAuth('/properties', { method: 'POST', body: propertyData }),
    getOwnerProperties: () => fetchWithAuth('/properties/owner'),
    getById: (id) => fetchWithAuth(`/properties/${id}`),
    update: (id, propertyData) => fetchWithAuth(`/properties/${id}`, { method: 'PUT', body: propertyData }),
    delete: (id) => fetchWithAuth(`/properties/${id}`, { method: 'DELETE' }),
    getStats: (id) => fetchWithAuth(`/properties/${id}/stats`),
  },

  // Rooms API
  rooms: {
    create: (roomData) => fetchWithAuth('/rooms', { method: 'POST', body: roomData }),
    getRoomsByProperty: (propertyId) => fetchWithAuth(`/rooms/property/${propertyId}`),
    getById: (id) => fetchWithAuth(`/rooms/${id}`),
    update: (id, roomData) => fetchWithAuth(`/rooms/${id}`, { method: 'PUT', body: roomData }),
    delete: (id) => fetchWithAuth(`/rooms/${id}`, { method: 'DELETE' }),
    bulkAdd: (propertyId, roomsList) => fetchWithAuth('/rooms/bulk', { method: 'POST', body: { propertyId, roomsList } }),
  },

  // Bookings / Reservations API
  bookings: {
    createManual: (bookingData) => fetchWithAuth('/bookings/manual', { method: 'POST', body: bookingData }),
    getOwnerBookings: () => fetchWithAuth('/bookings/owner'),
    getById: (id) => fetchWithAuth(`/bookings/${id}`),
    verifyOTP: (id, otp) => fetchWithAuth(`/bookings/${id}/verify-otp`, { method: 'POST', body: { otp } }),
    checkOut: (id) => fetchWithAuth(`/bookings/${id}/checkout`, { method: 'POST' }),
    updateUspSchedule: (id, uspId, updateData) => fetchWithAuth(`/bookings/${id}/usps/${uspId}`, { method: 'PUT', body: updateData }),
  },

  // Housekeeping API
  housekeeping: {
    createTask: (taskData) => fetchWithAuth('/housekeeping', { method: 'POST', body: taskData }),
    getPropertyTasks: (propertyId) => fetchWithAuth(`/housekeeping/property/${propertyId}`),
    updateTask: (id, updateData) => fetchWithAuth(`/housekeeping/${id}`, { method: 'PUT', body: updateData }),
    getMyTasks: () => fetchWithAuth('/housekeeping/my-tasks'),
  },

  // Coupons / Promotions API
  coupons: {
    create: (couponData) => fetchWithAuth('/coupons', { method: 'POST', body: couponData }),
    getPropertyCoupons: (propertyId) => fetchWithAuth(`/coupons/property/${propertyId}`),
    delete: (id) => fetchWithAuth(`/coupons/${id}`, { method: 'DELETE' }),
  },

  // Staff API
  staff: {
    add: (staffData) => fetchWithAuth('/staff', { method: 'POST', body: staffData }),
    getPropertyStaff: (propertyId) => fetchWithAuth(`/staff/property/${propertyId}`),
    update: (id, updateData) => fetchWithAuth(`/staff/${id}`, { method: 'PUT', body: updateData }),
    remove: (id) => fetchWithAuth(`/staff/${id}`, { method: 'DELETE' }),
  },

  // Payouts API
  payouts: {
    request: (amount) => fetchWithAuth('/payouts', { method: 'POST', body: { amount } }),
    getMyPayouts: () => fetchWithAuth('/payouts/me'),
  },

  // Vibes API
  vibes: {
    getAll: () => fetchWithAuth('/vibes'),
    create: (vibeData) => fetchWithAuth('/vibes', { method: 'POST', body: vibeData }),
    delete: (id) => fetchWithAuth(`/vibes/${id}`, { method: 'DELETE' })
  },

  // Messages API
  messages: {
    getThreads: (propertyId) => fetchWithAuth(`/messages/${propertyId}/threads`),
    get: (propertyId, customerId) => fetchWithAuth(`/messages/${propertyId}/${customerId}`),
    send: (propertyId, customerId, text) => fetchWithAuth(`/messages/${propertyId}/${customerId}`, { method: 'POST', body: { text } }),
    delete: (messageId) => fetchWithAuth(`/messages/${messageId}`, { method: 'DELETE' }),
    clear: (propertyId, customerId) => fetchWithAuth(`/messages/${propertyId}/${customerId}/clear`, { method: 'DELETE' })
  }
};

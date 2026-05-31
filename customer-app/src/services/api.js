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
    register: (userData) => fetchWithAuth('/auth/register', { method: 'POST', body: userData }),
    login: (credentials) => fetchWithAuth('/auth/login', { method: 'POST', body: credentials }),
    sendOTP: (phone) => fetchWithAuth('/auth/otp/send', { method: 'POST', body: { phone } }),
    verifyOTP: (phone, otp) => fetchWithAuth('/auth/otp/verify', { method: 'POST', body: { phone, otp } }),
    getMe: () => fetchWithAuth('/auth/me'),
    updateBank: (bankData) => fetchWithAuth('/auth/bank', { method: 'PUT', body: bankData }),
    updateProfile: (profileData) => fetchWithAuth('/auth/profile', { method: 'PUT', body: profileData }),
  },

  // Listings API
  listings: {
    create: (listingData) => fetchWithAuth('/listings', { method: 'POST', body: listingData }),
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.type) query.append('type', params.type);
      if (params.category) query.append('category', params.category);
      if (params.search) query.append('search', params.search);
      if (params.amenities) query.append('amenities', params.amenities);
      return fetchWithAuth(`/listings?${query.toString()}`);
    },
    getById: (id) => fetchWithAuth(`/listings/${id}`),
    getOwnerListings: () => fetchWithAuth('/listings/owner'),
    update: (id, listingData) => fetchWithAuth(`/listings/${id}`, { method: 'PUT', body: listingData }),
    delete: (id) => fetchWithAuth(`/listings/${id}`, { method: 'DELETE' }),
  },

  // Bookings API
  bookings: {
    create: (bookingData) => fetchWithAuth('/bookings', { method: 'POST', body: bookingData }),
    getCustomerBookings: () => fetchWithAuth('/bookings/customer'),
    getOwnerBookings: () => fetchWithAuth('/bookings/owner'),
    getById: (id) => fetchWithAuth(`/bookings/${id}`),
    submitReview: (id, reviewData) => fetchWithAuth(`/bookings/${id}/review`, { method: 'POST', body: reviewData }),
  },

  // Payouts API
  payouts: {
    request: (amount) => fetchWithAuth('/payouts', { method: 'POST', body: { amount } }),
    getMyPayouts: () => fetchWithAuth('/payouts/me'),
    getAll: () => fetchWithAuth('/payouts'),
    updateStatus: (id, status) => fetchWithAuth(`/payouts/${id}/status`, { method: 'PUT', body: { status } }),
  },

  // Rides API
  rides: {
    create: (rideData) => fetchWithAuth('/rides', { method: 'POST', body: rideData }),
    getMyRides: () => fetchWithAuth('/rides/me'),
    getById: (id) => fetchWithAuth(`/rides/${id}`),
    simulateProgress: (id, step) => fetchWithAuth(`/rides/${id}/simulate`, { method: 'POST', body: { step } }),
    getRoutePath: (id) => fetchWithAuth(`/rides/${id}/route`),
  },

  // Admin API
  admin: {
    getStats: () => fetchWithAuth('/admin/stats'),
    updateCommissionRate: (rate) => fetchWithAuth('/admin/commission', { method: 'PUT', body: { rate } }),
  },

  // Properties API
  properties: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.type) query.append('type', params.type);
      if (params.search) query.append('search', params.search);
      return fetchWithAuth(`/properties?${query.toString()}`);
    },
    getById: (id) => fetchWithAuth(`/properties/${id}`),
  },

  // Rooms API
  rooms: {
    getByProperty: (propertyId) => fetchWithAuth(`/rooms/property/${propertyId}`),
  },

  // Coupons API
  coupons: {
    validate: (propertyId, code) => fetchWithAuth('/coupons/validate', { method: 'POST', body: { propertyId, code } }),
  },

  // Vibes API
  vibes: {
    getAll: () => fetchWithAuth('/vibes'),
    create: (vibeData) => fetchWithAuth('/vibes', { method: 'POST', body: vibeData }),
    toggleLike: (id) => fetchWithAuth(`/vibes/${id}/like`, { method: 'POST' })
  }
};

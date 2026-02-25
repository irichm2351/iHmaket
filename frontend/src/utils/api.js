import axios from 'axios';

// Use production API URL for deployed app, otherwise use local
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Production - use Render backend
    return 'https://ihmaket-backend.onrender.com/api';
  }
  // Development - use local
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();
const API_BASE_URL = API_URL.replace(/\/api\/?$/, '');

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to get image URL
export const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/400x300?text=No+Image';
  if (typeof path === 'object' && path.url) return getImageUrl(path.url);
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
};

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadProfilePic: (formData) => {
    return api.post('/auth/upload-profile-pic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  changePassword: (data) => api.put('/auth/change-password', data),
  submitKyc: (formData) => {
    return api.post('/auth/kyc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// User API
export const userAPI = {
  getProviders: (params) => api.get('/users/providers', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  toggleSaveService: (serviceId) => api.post(`/users/save-service/${serviceId}`),
  getSavedServices: () => api.get('/users/saved-services'),
  getSupportAdmin: () => api.get('/users/support/admin'),
};

// Support API
export const supportAPI = {
  createSupportTicket: () => api.post('/support/tickets/create'),
  createSupportMessage: (data) => api.post('/support/messages', data),
  getOpenTickets: () => api.get('/support/tickets/open'),
  claimTicket: (ticketId) => api.post(`/support/tickets/${ticketId}/claim`)
};

// Service API
export const serviceAPI = {
  getServices: (params) => api.get('/services', { params }),
  getFeaturedServices: () => api.get('/services/featured'),
  getServiceById: (id) => api.get(`/services/${id}`),
  getServicesByProvider: (providerId) => api.get(`/services/provider/${providerId}`),
  getProviderServices: (providerId) => api.get(`/services/provider/${providerId}`),
  createService: (formData) => {
    return api.post('/services', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateService: (id, formData) => {
    return api.put(`/services/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteService: (id) => api.delete(`/services/${id}`),
};

// Booking API
export const bookingAPI = {
  createBooking: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings', { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  updateBookingStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  cancelBooking: (id, data) => api.put(`/bookings/${id}/cancel`, data),
};

// Review API
export const reviewAPI = {
  createReview: (data) => api.post('/reviews', data),
  getServiceReviews: (serviceId, params) => api.get(`/reviews/service/${serviceId}`, { params }),
  getProviderReviews: (providerId, params) => api.get(`/reviews/provider/${providerId}`, { params }),
  respondToReview: (id, data) => api.put(`/reviews/${id}/respond`, data),
};

// Message API
export const messageAPI = {
  sendMessage: (data) => api.post('/messages', data),
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId, params) => api.get(`/messages/${userId}`, { params }),
  markAsRead: (userId) => api.put(`/messages/${userId}/read`),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};

// Report API
export const reportAPI = {
  createReport: (data) => api.post('/reports', data),
  getAllReports: (params) => api.get('/reports', { params }),
  updateReportStatus: (id, data) => api.put(`/reports/${id}/status`, data),
  deleteReport: (id) => api.delete(`/reports/${id}`),
};

// Admin API (if needed)
export const adminAPI = {
  getAllUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
  getAllServices: (params) => api.get('/admin/services', { params }),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
  getAllBookings: (params) => api.get('/admin/bookings', { params }),
  getAnalytics: () => api.get('/admin/analytics'),
};

export default api;

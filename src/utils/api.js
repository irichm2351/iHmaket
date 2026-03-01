import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use production backend URL - can be overridden with EXPO_PUBLIC_API_URL environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://ihmaket-backend.onrender.com/api';
const API_BASE_URL = API_URL.replace(/\/api\/?$/, '');

console.log('=== API CONFIGURATION ===');
console.log('API_URL:', API_URL);
console.log('EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

const isFormDataRequest = (data) => {
  if (!data) return false;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
  if (typeof data.getParts === 'function') return true;
  if (Array.isArray(data._parts)) return true;
  return false;
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only set Content-Type for non-FormData requests
    // FormData requests should explicitly set their own Content-Type header
    if (config.data && !isFormDataRequest(config.data) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Log request details
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    if (config.data && !isFormDataRequest(config.data)) {
      console.log('Request data:', config.data);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('=== API ERROR ===');
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.message);
    console.log('Error data:', error.response?.data);
    console.log('Full error:', JSON.stringify(error, null, 2));
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      await SecureStore.deleteItemAsync('authToken');
    }
    return Promise.reject(error);
  }
);

export { API_URL };
export const getImageUrl = (path, fallback = 'https://via.placeholder.com/400x300?text=No+Image') => {
  if (!path) return fallback;

  if (typeof path === 'object') {
    if (path.url) return getImageUrl(path.url, fallback);
    if (path.uri) return getImageUrl(path.uri, fallback);
    return fallback;
  }

  const value = String(path).trim();
  if (!value) return fallback;

  const localhostMatch = value.match(/^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(?::\d+)?(\/.*)$/i);
  if (localhostMatch) {
    return encodeURI(`${API_BASE_URL}${localhostMatch[2]}`);
  }

  if (/^https?:\/\//i.test(value)) {
    return encodeURI(value);
  }

  if (value.startsWith('//')) {
    return encodeURI(`https:${value}`);
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return encodeURI(`${API_BASE_URL}${normalizedPath}`);
};
export default api;

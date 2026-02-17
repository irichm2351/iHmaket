import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use production backend URL - can be overridden with EXPO_PUBLIC_API_URL environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://ihmaket-backend.onrender.com/api';

console.log('=== API CONFIGURATION ===');
console.log('API_URL:', API_URL);
console.log('EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
});

const isFormDataRequest = (data) => {
  if (!data) return false;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
  if (typeof data.getParts === 'function') return true;
  if (Array.isArray(data._parts)) return true;
  return false;
};

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't override Content-Type for FormData (file uploads)
    // Let axios handle it automatically
    if (!isFormDataRequest(config.data)) {
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
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
export default api;

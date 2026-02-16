import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  // Initialize auth state from storage
  initializeAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        set({ token });
        // Verify token by fetching user
        const response = await api.get('/auth/me');
        set({ user: response.data.user, error: null });
      }
    } catch (error) {
      await SecureStore.deleteItemAsync('authToken');
      set({ token: null, user: null });
    }
  },

  // Login
  login: async (email, password) => {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password length:', password?.length);
    
    set({ isLoading: true, error: null });
    try {
      console.log('Calling API...');
      const response = await api.post('/auth/login', { email, password });
      
      console.log('Response received:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      const { token, user } = response.data;
      
      console.log('Token received:', token ? 'YES' : 'NO');
      console.log('User received:', user ? 'YES' : 'NO');
      
      await SecureStore.setItemAsync('authToken', token);
      set({ token, user, isLoading: false });
      
      console.log('=== LOGIN SUCCESS ===');
      return { success: true, user };
    } catch (error) {
      console.log('=== LOGIN ERROR ===');
      console.log('Error type:', error.constructor.name);
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      console.log('Response status:', error.response?.status);
      console.log('Response data:', error.response?.data);
      console.log('Full error:', JSON.stringify(error, null, 2));
      
      const errorMsg = error.response?.data?.message || error.message || 'Login failed';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  // Register
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      await SecureStore.setItemAsync('authToken', token);
      set({ token, user, isLoading: false });
      return { success: true, user };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  // Google OAuth Login
  googleLogin: async (accessToken) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/google-login', {
        accessToken,
      });
      const { token, user } = response.data;
      
      await SecureStore.setItemAsync('authToken', token);
      set({ token, user, isLoading: false });
      return { success: true, user };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Google login failed';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  // Apple OAuth Login
  appleLogin: async (identityToken) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/apple-login', {
        identityToken,
      });
      const { token, user } = response.data;
      
      await SecureStore.setItemAsync('authToken', token);
      set({ token, user, isLoading: false });
      return { success: true, user };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Apple login failed';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  // Logout
  logout: async () => {
    await SecureStore.deleteItemAsync('authToken');
    set({ token: null, user: null, error: null });
  },

  // Update profile
  updateProfile: async (updates) => {
    set({ isLoading: true });
    try {
      const response = await api.put('/auth/profile', updates);
      set({ user: response.data.user, isLoading: false, error: null });
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Update failed';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  // Update profile picture
  updateProfilePicture: async (profilePicUrl) => {
    set((state) => ({
      user: state.user ? { ...state.user, profilePic: profilePicUrl } : null
    }));
  },
}));

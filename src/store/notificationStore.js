import { create } from 'zustand';
import api from '../utils/api';
import * as Haptics from 'expo-haptics';
import { playNotificationSound } from '../utils/notificationSound';

export const useNotificationStore = create((set) => ({
  messageCount: 0,
  bookingCount: 0,

  // Set message count
  setMessageCount: (count) => {
    set({ messageCount: count });
  },

  // Set booking count
  setBookingCount: (count) => {
    set({ bookingCount: count });
  },

  // Increment message count with notification
  incrementMessageCount: () => {
    set((state) => ({ messageCount: state.messageCount + 1 }));
    // Trigger sound and haptic feedback
    playNotificationSound('message');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Increment booking count with notification
  incrementBookingCount: () => {
    set((state) => ({ bookingCount: state.bookingCount + 1 }));
    // Trigger sound and haptic feedback
    playNotificationSound('booking');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Decrement message count
  decrementMessageCount: () => {
    set((state) => ({ messageCount: Math.max(0, state.messageCount - 1) }));
  },

  // Decrement booking count
  decrementBookingCount: () => {
    set((state) => ({ bookingCount: Math.max(0, state.bookingCount - 1) }));
  },

  // Reset message count
  resetMessageCount: () => {
    set({ messageCount: 0 });
  },

  // Reset booking count
  resetBookingCount: () => {
    set({ bookingCount: 0 });
  },

  // Initialize notification counts from API
  initializeNotificationCounts: async (userId) => {
    if (!userId) {
      return;
    }

    try {
      // Fetch unread messages count
      const messagesResponse = await api.get('/messages/unread-count');
      if (messagesResponse.data.success) {
        set({ messageCount: messagesResponse.data.count || 0 });
      }

      // Fetch pending bookings count
      const bookingsResponse = await api.get('/bookings/pending-count');
      if (bookingsResponse.data.success) {
        set({ bookingCount: bookingsResponse.data.count || 0 });
      }
    } catch (error) {
      // If the API is unavailable or returns an error, keep counts at 0
      set({ messageCount: 0, bookingCount: 0 });
    }
  },
}));

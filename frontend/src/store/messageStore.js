import { create } from 'zustand';

const useMessageStore = create((set) => ({
  unreadCount: 0,
  supportCount: 0,

  setConversations: (conversations) => {
    const unreadCount = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
    set({ unreadCount });
  },

  incrementUnread: () => {
    set((state) => ({
      unreadCount: state.unreadCount + 1
    }));
  },

  setSupportCount: (count) => {
    set({ supportCount: count });
  },

  incrementSupportCount: () => {
    set((state) => ({
      supportCount: state.supportCount + 1
    }));
  },

  decrementSupportCount: () => {
    set((state) => ({
      supportCount: Math.max(0, state.supportCount - 1)
    }));
  },

  reset: () => {
    set({ unreadCount: 0, supportCount: 0 });
  },
}));

export default useMessageStore;

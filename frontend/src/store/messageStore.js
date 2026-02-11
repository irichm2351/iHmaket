import { create } from 'zustand';

const useMessageStore = create((set) => ({
  unreadCount: 0,

  setConversations: (conversations) => {
    const unreadCount = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
    set({ unreadCount });
  },

  incrementUnread: () => {
    set((state) => ({
      unreadCount: state.unreadCount + 1
    }));
  },

  reset: () => {
    set({ unreadCount: 0 });
  },
}));

export default useMessageStore;

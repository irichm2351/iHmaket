import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FiMessageCircle } from 'react-icons/fi';
import Navbar from './Navbar';
import Footer from './Footer';
import SupportChatModal from './SupportChatModal';
import useAuthStore from '../store/authStore';
import useMessageStore from '../store/messageStore';
import { messageAPI, supportAPI } from '../utils/api';
import socket, { connectSocket } from '../utils/socket';
import toast from 'react-hot-toast';

const Layout = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const {
    setConversations,
    incrementUnread,
    reset,
    setSupportCount,
    incrementSupportCount
  } = useMessageStore();
  const notificationSoundRef = useRef(null);
  const [showChatModal, setShowChatModal] = useState(false);

  const handleContactSupport = () => {
    if (!isAuthenticated) {
      toast.error('Please login to contact support');
      return;
    }

    setShowChatModal(true);
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    notificationSoundRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWe77eWeTRAMUKfj8LZjGwU4kte0'
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      reset();
      return;
    }

    connectSocket(user._id);

    const handleReceiveMessage = (data) => {
      if (!location.pathname.startsWith('/messages')) {
        incrementUnread();
      }

      if (notificationSoundRef.current) {
        notificationSoundRef.current.play().catch(() => {});
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        const senderName = typeof data?.senderId === 'object' ? data.senderId?.name : 'New message';
        const icon = typeof data?.senderId === 'object' ? data.senderId?.profilePic : '/favicon.ico';
        const notification = new Notification('New Message', {
          body: data?.text ? `${senderName}: ${data.text}` : senderName,
          icon,
          badge: '/favicon.ico',
          tag: data?.senderId?._id || 'message'
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 5000);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [isAuthenticated, user?._id, location.pathname, incrementUnread, reset]);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    const loadUnreadCounts = async () => {
      try {
        const response = await messageAPI.getConversations();
        const list = response.data.conversations || [];
        setConversations(list);
      } catch {
        // Ignore unread fetch failures
      }
    };

    loadUnreadCounts();
  }, [isAuthenticated, user?._id, setConversations]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    const loadSupportCount = async () => {
      try {
        const response = await supportAPI.getOpenTickets();
        const tickets = response.data.tickets || [];
        setSupportCount(tickets.length);
      } catch {
        // Ignore support count failures
      }
    };

    loadSupportCount();

    const handleSupportRequest = () => {
      incrementSupportCount();
    };

    socket.on('support_request', handleSupportRequest);
    return () => socket.off('support_request', handleSupportRequest);
  }, [isAuthenticated, user?.role, setSupportCount, incrementSupportCount]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      
      {/* Floating Support Chat Button - Web/Desktop/Mobile Browser Only (Not for Phone App) */}
      {typeof window !== 'undefined' && isAuthenticated && user?.role !== 'admin' && (
        <button
          onClick={handleContactSupport}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          title="Contact Support"
          aria-label="Contact Support"
        >
          <FiMessageCircle size={24} className="group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {/* Support Chat Modal */}
      {showChatModal && (
        <SupportChatModal
          userId={user?._id}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
};

export default Layout;

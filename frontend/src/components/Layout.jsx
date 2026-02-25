import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import useAuthStore from '../store/authStore';
import useMessageStore from '../store/messageStore';
import { messageAPI } from '../utils/api';
import socket, { connectSocket } from '../utils/socket';

const Layout = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const {
    setConversations,
    incrementUnread,
    reset
  } = useMessageStore();
  const notificationSoundRef = useRef(null);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

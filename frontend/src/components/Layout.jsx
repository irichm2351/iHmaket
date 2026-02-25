import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FiMessageCircle } from 'react-icons/fi';
import Navbar from './Navbar';
import Footer from './Footer';
import SupportChatModal from './SupportChatModal';
import SocketDebugPanel from './SocketDebugPanel';
import useAuthStore from '../store/authStore';
import useMessageStore from '../store/messageStore';
import { messageAPI, supportAPI } from '../utils/api';
import socket, { connectSocket } from '../utils/socket';
import toast from 'react-hot-toast';
import { debugSupport } from '../utils/debugSupport';

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
  const [supportAlerts, setSupportAlerts] = useState([]);

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

    debugSupport.info('User authenticated, connecting socket', {
      userId: user._id,
      userName: user.name,
      userRole: user.role
    });

    connectSocket(user._id);

    // Verify socket connection after a short delay
    setTimeout(() => {
      if (socket.connected) {
        debugSupport.success('Socket connection verified', {
          socketId: socket.id,
          userId: user._id
        });
      } else {
        debugSupport.error('Socket not connected after timeout', {
          userId: user._id
        });
      }
    }, 2000);

    // Admin listener for support requests
    if (user?.role === 'admin') {
      debugSupport.info('Setting up admin support request listener', {
        adminId: user._id,
        adminName: user.name
      });

      const handleSupportRequest = (data) => {
        console.log('[Layout] Admin received support request:', data);
        debugSupport.socket('Admin received support request', { 
          userName: data?.user?.name,
          ticketId: data?.ticketId,
          lastMessage: data?.lastMessage
        });
        
        setSupportAlerts((prev) => [...prev, data]);
        incrementSupportCount();
        
        // Show toast
        toast.success(`${data?.user?.name} needs help!`, {
          duration: 5000,
          icon: '🔔',
        });

        // Play sound
        if (notificationSoundRef.current) {
          notificationSoundRef.current.play().catch(() => {});
        }

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Support Request', {
            body: `${data?.user?.name} is requesting support`,
            icon: data?.user?.profilePic || '/favicon.ico',
            tag: 'support-request'
          });
        }
      };

      socket.on('support_request', handleSupportRequest);
      debugSupport.success('Admin support request listener registered', {
        adminId: user._id
      });

      return () => {
        socket.off('support_request', handleSupportRequest);
        debugSupport.info('Admin support request listener removed', {
          adminId: user._id
        });
      };
    }

    // User listener for regular messages
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
  }, [isAuthenticated, user?._id, user?.role, location.pathname, incrementUnread, reset, incrementSupportCount]);

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
  }, [isAuthenticated, user?.role, setSupportCount]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      
      {/* Floating Support Chat Button - Users & Admins */}
      {typeof window !== 'undefined' && isAuthenticated && (
        <button
          onClick={() => setShowChatModal(true)}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          title={user?.role === 'admin' ? 'Support Center' : 'Contact Support'}
          aria-label="Support"
        >
          <FiMessageCircle size={24} className="group-hover:animate-pulse" />
          {user?.role === 'admin' && incrementSupportCount && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {supportAlerts.length > 0 ? supportAlerts.length : ''}
            </span>
          )}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {/* Support Chat Modal - For both users and admins */}
      {showChatModal && (
        <SupportChatModal
          userId={user?._id}
          userRole={user?.role}
          userName={user?.name}
          userProfilePic={user?.profilePic}
          supportAlert={supportAlerts[supportAlerts.length - 1]} // Pass latest alert to admin
          onClose={() => {
            setShowChatModal(false);
            if (user?.role === 'admin' && supportAlerts.length > 0) {
              setSupportAlerts((prev) => prev.slice(1)); // Remove the current alert
            }
          }}
        />
      )}

      {/* Socket Debug Panel - Development/Testing */}
      {isAuthenticated && (
        <SocketDebugPanel />
      )}
    </div>
  );
};

export default Layout;

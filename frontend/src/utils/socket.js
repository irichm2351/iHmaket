import { io } from 'socket.io-client';

// Use production socket URL for deployed app, otherwise use local
const getSocketUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Production - use Render backend
    return 'https://ihmaket-backend.onrender.com';
  }
  // Development - use local or environment variable
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export const connectSocket = (userId) => {
  if (!socket.connected) {
    socket.connect();
  }

  if (userId) {
    if (socket.connected) {
      socket.emit('user_connected', userId);
    } else {
      socket.once('connect', () => {
        socket.emit('user_connected', userId);
      });
    }
  }
};

export default socket;

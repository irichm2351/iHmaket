import { io } from 'socket.io-client';

// Auto-detect production vs development
const getSocketUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Production - use Render backend
    return 'https://ihmaket-backend.onrender.com';
  }
  // Development - use local or env variable
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

console.log(`🔌 Socket connecting to: ${SOCKET_URL}`);

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Debug socket connection events
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket disconnected:', reason);
});

export const connectSocket = (userId) => {
  if (!socket.connected) {
    console.log(`🔌 Connecting socket for user: ${userId}`);
    socket.connect();
  }

  if (userId) {
    if (socket.connected) {
      console.log(`👤 Emitting user_connected for: ${userId}`);
      socket.emit('user_connected', userId);
    } else {
      socket.once('connect', () => {
        console.log(`👤 Emitting user_connected for: ${userId} (after connection)`);
        socket.emit('user_connected', userId);
      });
    }
  }
};

export default socket;

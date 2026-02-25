import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://ihmaket-backend.onrender.com';
  }

  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('[Socket] ✅ Connected to server');
});

socket.on('connect_error', (error) => {
  console.error('[Socket] ❌ Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] 🔌 Disconnected:', reason);
});

export const connectSocket = (userId) => {
  console.log('[Socket] connectSocket called for userId:', userId);
  
  if (!socket.connected) {
    console.log('[Socket] Connecting to', SOCKET_URL);
    socket.connect();
  }

  if (userId) {
    if (socket.connected) {
      console.log('[Socket] ✅ Already connected, emitting user_connected');
      socket.emit('user_connected', userId);
    } else {
      console.log('[Socket] ⏳ Waiting for connection...');
      socket.once('connect', () => {
        console.log('[Socket] ✅ Connected! Emitting user_connected with userId:', userId);
        socket.emit('user_connected', userId);
      });
    }
  }
};

export default socket;

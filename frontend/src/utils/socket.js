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
  transports: ['websocket', 'polling']
});

export const connectSocket = (userId) => {
  if (!socket.connected) {
    console.log('[Socket] Connecting socket...');
    socket.connect();
  }

  if (userId) {
    if (socket.connected) {
      console.log('[Socket] Emitting user_connected with userId:', userId);
      socket.emit('user_connected', userId);
    } else {
      socket.once('connect', () => {
        console.log('[Socket] Connected! Emitting user_connected with userId:', userId);
        socket.emit('user_connected', userId);
      });
    }
  }
};

export default socket;

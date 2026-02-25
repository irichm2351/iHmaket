import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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

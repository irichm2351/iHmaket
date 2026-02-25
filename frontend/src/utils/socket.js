import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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

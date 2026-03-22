import {io} from 'socket.io-client';

const socket = io('https://freetravelapp-production.up.railway.app', {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
});

socket.on('connect', () => {
  console.log('SOCKET CONNECTED:', socket.id);
});

socket.on('disconnect', () => {
  console.log('SOCKET DISCONNECTED');
});

export default socket;

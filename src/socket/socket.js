import {io} from 'socket.io-client';

const socket = io('http://10.0.2.2:3000', {
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

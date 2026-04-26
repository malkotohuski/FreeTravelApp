import {io} from 'socket.io-client';

const socket = io('https://freetravelapp-production.up.railway.app', {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
});

socket.on('connect', () => {
});

socket.on('disconnect', () => {
});

export default socket;

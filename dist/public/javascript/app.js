import { Controller } from './controller/controller.js';
import { io } from 'socket.io-client';
const socket = io();
socket.on('connectToRoom', function (data) {
  console.log(data);
});
const controller = new Controller('vsAI', 'oldcity', 'basicDeck');

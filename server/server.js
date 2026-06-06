const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('client'));

const rooms = {};

io.on('connection', (socket) => {
  socket.on('create-room', (roomCode) => {
    rooms[roomCode] = { players: [socket.id] };
    socket.join(roomCode);
    socket.emit('room-created', roomCode);
  });

  socket.on('join-room', (roomCode) => {
    if (!rooms[roomCode]) {
      socket.emit('error-message', 'Room not found');
      return;
    }
    rooms[roomCode].players.push(socket.id);
    socket.join(roomCode);
    io.to(roomCode).emit('player-count', rooms[roomCode].players.length);
  });
});

server.listen(3000, () => console.log('Server running on 3000'));
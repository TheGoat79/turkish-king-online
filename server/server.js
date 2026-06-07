const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const registerGameSocket = require('./sockets/gameSocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static('client'));

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  registerGameSocket(io, socket);

  socket.on('error', (err) => {
    console.error('Socket error for', socket.id, err);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server running on', PORT);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
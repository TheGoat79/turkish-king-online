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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server running on', PORT);
});
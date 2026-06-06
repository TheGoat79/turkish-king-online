const GameRoom = require('../game/GameRoom');

const rooms = {};

function getRoom(roomCode) {
  if (!rooms[roomCode]) {
    rooms[roomCode] = new GameRoom(roomCode);
  }
  return rooms[roomCode];
}

function registerGameSocket(io, socket) {

  socket.on('create-room', (roomCode) => {
    const room = getRoom(roomCode);

    room.addPlayer(socket.id);
    socket.join(roomCode);

    socket.emit('room-created', roomCode);
    io.to(roomCode).emit('player-count', room.players.length);
  });

  socket.on('join-room', (roomCode) => {
    const room = getRoom(roomCode);

    if (!room.addPlayer(socket.id)) {
      socket.emit('error-message', 'Room full');
      return;
    }

    socket.join(roomCode);
    io.to(roomCode).emit('player-count', room.players.length);
  });

  socket.on('start-game', (roomCode) => {
    const room = getRoom(roomCode);

    if (room.players.length !== 4) {
      socket.emit('error-message', 'Need 4 players');
      return;
    }

    room.startGame();

    // send hands privately
    room.players.forEach(p => {
      io.to(p.id).emit('your-hand', p.hand);
    });

    io.to(roomCode).emit('game-started');
  });

  socket.on('play-card', ({ roomCode, index }) => {
    const room = getRoom(roomCode);

    const card = room.playCard(socket.id, index);

    if (!card) {
      socket.emit('error-message', 'Invalid move');
      return;
    }

    io.to(roomCode).emit('card-played', {
      playerId: socket.id,
      card
    });
  });

}

module.exports = registerGameSocket;
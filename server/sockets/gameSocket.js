const GameRoom = require('../game/GameRoom');

const rooms = Object.create(null);

const ROOM_CODE_RE = /^[A-Z0-9]{3,8}$/;

function isValidRoomCode(code) {
  return typeof code === 'string' && ROOM_CODE_RE.test(code);
}

function getRoom(roomCode) {
  if (!rooms[roomCode]) {
    rooms[roomCode] = new GameRoom(roomCode);
  }
  return rooms[roomCode];
}

function registerGameSocket(io, socket) {
  let playerRoom = null;

  socket.on('create-room', (roomCode) => {
    if (!isValidRoomCode(roomCode)) {
      socket.emit('error-message', 'Invalid room code');
      return;
    }

    if (rooms[roomCode]) {
      socket.emit('error-message', 'Room already exists');
      return;
    }

    const room = getRoom(roomCode);

    room.addPlayer(socket.id);
    socket.join(roomCode);
    playerRoom = roomCode;

    socket.emit('room-created', roomCode);
    io.to(roomCode).emit('player-count', room.players.length);
  });

  socket.on('join-room', (roomCode) => {
    if (!isValidRoomCode(roomCode)) {
      socket.emit('error-message', 'Invalid room code');
      return;
    }

    if (!rooms[roomCode]) {
      socket.emit('error-message', 'Room not found');
      return;
    }

    const room = getRoom(roomCode);

    if (!room.addPlayer(socket.id)) {
      socket.emit('error-message', 'Room full');
      return;
    }

    socket.join(roomCode);
    playerRoom = roomCode;
    io.to(roomCode).emit('player-count', room.players.length);
  });

  socket.on('start-game', (roomCode) => {
    if (!isValidRoomCode(roomCode) || roomCode !== playerRoom) {
      socket.emit('error-message', 'Not in this room');
      return;
    }

    const room = rooms[roomCode];
    if (!room) return;

    if (room.players.length !== 4) {
      socket.emit('error-message', 'Need 4 players');
      return;
    }

    room.startGame();

    room.players.forEach(p => {
      io.to(p.id).emit('your-hand', p.hand);
    });

    io.to(roomCode).emit('game-started');
  });

  socket.on('play-card', (data) => {
    if (!data || typeof data !== 'object') {
      socket.emit('error-message', 'Invalid data');
      return;
    }

    const { roomCode, index } = data;

    if (!isValidRoomCode(roomCode) || roomCode !== playerRoom) {
      socket.emit('error-message', 'Not in this room');
      return;
    }

    if (!Number.isInteger(index) || index < 0) {
      socket.emit('error-message', 'Invalid card index');
      return;
    }

    const room = rooms[roomCode];
    if (!room) return;

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

  socket.on('disconnect', () => {
    if (playerRoom && rooms[playerRoom]) {
      const room = rooms[playerRoom];
      room.removePlayer(socket.id);

      if (room.players.length === 0) {
        delete rooms[playerRoom];
      } else {
        io.to(playerRoom).emit('player-count', room.players.length);
      }
    }
  });
}

module.exports = registerGameSocket;
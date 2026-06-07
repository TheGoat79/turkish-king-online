const GameRoom = require('../game/GameRoom');

const rooms = Object.create(null);

const ROOM_CODE_RE = /^[A-Z0-9]{3,8}$/;
const MAX_NAME_LENGTH = 20;

function isValidRoomCode(code) {
  return typeof code === 'string' && ROOM_CODE_RE.test(code);
}

function sanitizeName(name) {
  const str = String(name || '').trim().slice(0, MAX_NAME_LENGTH);
  return str.replace(/[<>"'&]/g, '') || 'Player';
}

function getRoom(roomCode) {
  if (!rooms[roomCode]) {
    rooms[roomCode] = new GameRoom(roomCode);
  }
  return rooms[roomCode];
}

function broadcastState(io, room) {
  io.to(room.roomCode).emit('state', room.publicState());
}

function sendHands(io, room) {
  room.players.forEach(p => {
    io.to(p.id).emit('your-hand', p.hand);
  });
}

function registerGameSocket(io, socket) {
  socket.data.roomCode = null;

  function join(roomCode, name) {
    const code = String(roomCode || '').trim().toUpperCase();
    if (!isValidRoomCode(code)) {
      socket.emit('error-message', 'Invalid room code');
      return null;
    }

    const safeName = sanitizeName(name);

    const room = getRoom(code);
    if (!room.addPlayer(socket.id, safeName)) {
      socket.emit('error-message', 'Room is full');
      return null;
    }

    socket.join(code);
    socket.data.roomCode = code;
    return room;
  }

  socket.on('create-room', (data) => {
    if (!data || typeof data !== 'object') {
      socket.emit('error-message', 'Invalid data');
      return;
    }
    const room = join(data.roomCode, data.name);
    if (!room) return;

    socket.emit('room-created', room.roomCode);
    broadcastState(io, room);
  });

  socket.on('join-room', (data) => {
    if (!data || typeof data !== 'object') {
      socket.emit('error-message', 'Invalid data');
      return;
    }
    const room = join(data.roomCode, data.name);
    if (!room) return;

    socket.emit('room-joined', room.roomCode);
    broadcastState(io, room);
  });

  socket.on('start-game', () => {
    const room = rooms[socket.data.roomCode];
    if (!room) return;

    if (!room.startGame()) {
      socket.emit('error-message', 'Need exactly 4 players to start');
      return;
    }

    sendHands(io, room);
    io.to(room.roomCode).emit('game-started');
    broadcastState(io, room);
  });

  socket.on('play-card', (data) => {
    if (!data || typeof data !== 'object') {
      socket.emit('error-message', 'Invalid data');
      return;
    }

    const { index } = data;

    if (!Number.isInteger(index) || index < 0) {
      socket.emit('error-message', 'Invalid card index');
      return;
    }

    const room = rooms[socket.data.roomCode];
    if (!room) return;

    const result = room.playCard(socket.id, index);
    if (!result.ok) {
      socket.emit('error-message', result.error);
      return;
    }

    io.to(room.roomCode).emit('card-played', {
      playerId: result.playerId,
      card: result.card
    });

    if (result.trickComplete) {
      io.to(room.roomCode).emit('trick-won', { winnerId: result.trickWinner });
    }
    if (result.roundOver) {
      io.to(room.roomCode).emit('round-over', { scores: result.scores });
    }

    socket.emit('your-hand', room.players.find(p => p.id === socket.id)?.hand || []);
    broadcastState(io, room);
  });

  socket.on('disconnect', () => {
    const room = rooms[socket.data.roomCode];
    if (!room) return;

    room.removePlayer(socket.id);

    if (room.players.length === 0) {
      delete rooms[room.roomCode];
      return;
    }

    io.to(room.roomCode).emit('error-message', 'A player left — game reset');
    broadcastState(io, room);
  });
}

module.exports = registerGameSocket;

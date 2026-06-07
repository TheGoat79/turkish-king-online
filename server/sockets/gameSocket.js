const GameRoom = require('../game/GameRoom');

const rooms = {};

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
  // Track which room this socket belongs to so we can clean up on disconnect.
  socket.data.roomCode = null;

  function join(roomCode, name) {
    const code = String(roomCode || '').trim().toUpperCase();
    if (!code) {
      socket.emit('error-message', 'Invalid room code');
      return null;
    }

    const room = getRoom(code);
    if (!room.addPlayer(socket.id, name)) {
      socket.emit('error-message', 'Room is full');
      return null;
    }

    socket.join(code);
    socket.data.roomCode = code;
    return room;
  }

  socket.on('create-room', (data) => {
    try {
      const { roomCode, name } = data || {};
      const room = join(roomCode, name);
      if (!room) return;

      socket.emit('room-created', room.roomCode);
      broadcastState(io, room);
    } catch (err) {
      console.error('create-room error:', err);
      socket.emit('error-message', 'Server error while creating room');
    }
  });

  socket.on('join-room', (data) => {
    try {
      const { roomCode, name } = data || {};
      const room = join(roomCode, name);
      if (!room) return;

      socket.emit('room-joined', room.roomCode);
      broadcastState(io, room);
    } catch (err) {
      console.error('join-room error:', err);
      socket.emit('error-message', 'Server error while joining room');
    }
  });

  socket.on('start-game', () => {
    try {
      const room = rooms[socket.data.roomCode];
      if (!room) return;

      if (!room.startGame()) {
        socket.emit('error-message', 'Need exactly 4 players to start');
        return;
      }

      sendHands(io, room);
      io.to(room.roomCode).emit('game-started');
      broadcastState(io, room);
    } catch (err) {
      console.error('start-game error:', err);
      socket.emit('error-message', 'Server error while starting game');
    }
  });

  socket.on('play-card', (data) => {
    try {
      const { index } = data || {};
      const room = rooms[socket.data.roomCode];
      if (!room) return;

      if (typeof index !== 'number' || index < 0) {
        socket.emit('error-message', 'Invalid card index');
        return;
      }

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

      // Refresh the playing player's hand and the shared table state.
      socket.emit('your-hand', room.players.find(p => p.id === socket.id)?.hand || []);
      broadcastState(io, room);
    } catch (err) {
      console.error('play-card error:', err);
      socket.emit('error-message', 'Server error while playing card');
    }
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

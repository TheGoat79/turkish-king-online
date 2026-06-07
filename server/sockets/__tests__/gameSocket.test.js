describe('gameSocket', () => {
  let io;
  let socket;
  let handlers;
  let registerGameSocket;

  beforeEach(() => {
    // Isolate module state (the `rooms` object) between tests
    jest.resetModules();
    registerGameSocket = require('../gameSocket');

    handlers = {};

    socket = {
      id: 'socket-1',
      on: jest.fn((event, cb) => { handlers[event] = cb; }),
      join: jest.fn(),
      emit: jest.fn()
    };

    io = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() })
    };

    registerGameSocket(io, socket);
  });

  it('should register event handlers', () => {
    const events = socket.on.mock.calls.map(c => c[0]);
    expect(events).toContain('create-room');
    expect(events).toContain('join-room');
    expect(events).toContain('start-game');
    expect(events).toContain('play-card');
  });

  describe('create-room', () => {
    it('should join the socket to the room and emit room-created', () => {
      handlers['create-room']('ROOM1');

      expect(socket.join).toHaveBeenCalledWith('ROOM1');
      expect(socket.emit).toHaveBeenCalledWith('room-created', 'ROOM1');
    });

    it('should broadcast player-count to the room', () => {
      const roomEmit = jest.fn();
      io.to.mockReturnValue({ emit: roomEmit });

      handlers['create-room']('ROOM1');

      expect(io.to).toHaveBeenCalledWith('ROOM1');
      expect(roomEmit).toHaveBeenCalledWith('player-count', 1);
    });
  });

  describe('join-room', () => {
    it('should join an existing room', () => {
      handlers['create-room']('ROOM1');

      const socket2Handlers = {};
      const socket2 = {
        id: 'socket-2',
        on: jest.fn((event, cb) => { socket2Handlers[event] = cb; }),
        join: jest.fn(),
        emit: jest.fn()
      };
      const roomEmit = jest.fn();
      io.to.mockReturnValue({ emit: roomEmit });

      registerGameSocket(io, socket2);
      socket2Handlers['join-room']('ROOM1');

      expect(socket2.join).toHaveBeenCalledWith('ROOM1');
    });

    it('should emit error-message when room is full', () => {
      handlers['create-room']('FULL');
      for (let i = 2; i <= 4; i++) {
        const h = {};
        const s = {
          id: `socket-${i}`,
          on: jest.fn((event, cb) => { h[event] = cb; }),
          join: jest.fn(),
          emit: jest.fn()
        };
        registerGameSocket(io, s);
        h['join-room']('FULL');
      }

      const h5 = {};
      const s5 = {
        id: 'socket-5',
        on: jest.fn((event, cb) => { h5[event] = cb; }),
        join: jest.fn(),
        emit: jest.fn()
      };
      registerGameSocket(io, s5);
      h5['join-room']('FULL');

      expect(s5.emit).toHaveBeenCalledWith('error-message', 'Room full');
    });
  });

  describe('start-game', () => {
    it('should emit error-message if fewer than 4 players', () => {
      handlers['create-room']('ROOM1');

      socket.emit.mockClear();
      handlers['start-game']('ROOM1');

      expect(socket.emit).toHaveBeenCalledWith('error-message', 'Need 4 players');
    });

    it('should start the game and send hands when 4 players are present', () => {
      handlers['create-room']('ROOM1');

      for (let i = 2; i <= 4; i++) {
        const h = {};
        const s = {
          id: `socket-${i}`,
          on: jest.fn((event, cb) => { h[event] = cb; }),
          join: jest.fn(),
          emit: jest.fn()
        };
        registerGameSocket(io, s);
        h['join-room']('ROOM1');
      }

      const emitCalls = [];
      io.to.mockImplementation((target) => ({
        emit: jest.fn((...args) => emitCalls.push({ target, args }))
      }));

      handlers['start-game']('ROOM1');

      const handEmits = emitCalls.filter(c => c.args[0] === 'your-hand');
      const gameStartedEmits = emitCalls.filter(c => c.args[0] === 'game-started');
      expect(handEmits).toHaveLength(4);
      expect(gameStartedEmits).toHaveLength(1);
    });
  });

  describe('play-card', () => {
    beforeEach(() => {
      handlers['create-room']('ROOM1');

      for (let i = 2; i <= 4; i++) {
        const h = {};
        const s = {
          id: `socket-${i}`,
          on: jest.fn((event, cb) => { h[event] = cb; }),
          join: jest.fn(),
          emit: jest.fn()
        };
        registerGameSocket(io, s);
        h['join-room']('ROOM1');
      }

      io.to.mockImplementation(() => ({
        emit: jest.fn()
      }));
      handlers['start-game']('ROOM1');
    });

    it('should broadcast card-played on valid move', () => {
      const broadcastEmit = jest.fn();
      io.to.mockReturnValue({ emit: broadcastEmit });

      handlers['play-card']({ roomCode: 'ROOM1', index: 0 });

      expect(broadcastEmit).toHaveBeenCalledWith(
        'card-played',
        expect.objectContaining({
          playerId: 'socket-1',
          card: expect.anything()
        })
      );
    });

    it('should emit error-message for invalid move', () => {
      handlers['play-card']({ roomCode: 'ROOM1', index: 0 });

      socket.emit.mockClear();
      handlers['play-card']({ roomCode: 'ROOM1', index: 0 });

      expect(socket.emit).toHaveBeenCalledWith('error-message', 'Invalid move');
    });
  });
});

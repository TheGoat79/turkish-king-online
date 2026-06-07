const GameRoom = require('../GameRoom');

describe('GameRoom', () => {
  describe('constructor', () => {
    it('should initialize with the given room code', () => {
      const room = new GameRoom('ABC');
      expect(room.roomCode).toBe('ABC');
    });

    it('should start with empty players, no deck, and game not started', () => {
      const room = new GameRoom('ABC');
      expect(room.players).toEqual([]);
      expect(room.deck).toBeNull();
      expect(room.trick).toEqual([]);
      expect(room.currentTurn).toBe(0);
      expect(room.started).toBe(false);
      expect(room.scores).toEqual({});
    });
  });

  describe('addPlayer()', () => {
    it('should add a player and return true', () => {
      const room = new GameRoom('ABC');
      const result = room.addPlayer('p1');
      expect(result).toBe(true);
      expect(room.players).toHaveLength(1);
      expect(room.players[0].id).toBe('p1');
    });

    it('should track the player score', () => {
      const room = new GameRoom('ABC');
      room.addPlayer('p1');
      expect(room.scores['p1']).toBe(0);
    });

    it('should allow up to 4 players', () => {
      const room = new GameRoom('ABC');
      expect(room.addPlayer('p1')).toBe(true);
      expect(room.addPlayer('p2')).toBe(true);
      expect(room.addPlayer('p3')).toBe(true);
      expect(room.addPlayer('p4')).toBe(true);
      expect(room.players).toHaveLength(4);
    });

    it('should reject a 5th player and return false', () => {
      const room = new GameRoom('ABC');
      room.addPlayer('p1');
      room.addPlayer('p2');
      room.addPlayer('p3');
      room.addPlayer('p4');

      const result = room.addPlayer('p5');
      expect(result).toBe(false);
      expect(room.players).toHaveLength(4);
    });
  });

  describe('startGame()', () => {
    let room;

    beforeEach(() => {
      room = new GameRoom('ABC');
      room.addPlayer('p1');
      room.addPlayer('p2');
      room.addPlayer('p3');
      room.addPlayer('p4');
    });

    it('should return true when exactly 4 players are present', () => {
      expect(room.startGame()).toBe(true);
    });

    it('should set started to true', () => {
      room.startGame();
      expect(room.started).toBe(true);
    });

    it('should deal 13 cards to each player', () => {
      room.startGame();
      room.players.forEach(p => {
        expect(p.hand).toHaveLength(13);
      });
    });

    it('should reset currentTurn to 0', () => {
      room.currentTurn = 2;
      room.startGame();
      expect(room.currentTurn).toBe(0);
    });

    it('should create a deck', () => {
      room.startGame();
      expect(room.deck).not.toBeNull();
    });

    it('should return false if fewer than 4 players', () => {
      const smallRoom = new GameRoom('XYZ');
      smallRoom.addPlayer('p1');
      smallRoom.addPlayer('p2');
      expect(smallRoom.startGame()).toBe(false);
      expect(smallRoom.started).toBe(false);
    });
  });

  describe('playCard()', () => {
    let room;

    beforeEach(() => {
      room = new GameRoom('ABC');
      room.addPlayer('p1');
      room.addPlayer('p2');
      room.addPlayer('p3');
      room.addPlayer('p4');
      room.startGame();
    });

    it('should allow the current player to play a card', () => {
      const playerId = room.players[0].id;
      const card = room.playCard(playerId, 0);
      expect(card).toBeDefined();
      expect(card).not.toBeNull();
    });

    it('should add the played card to the trick', () => {
      const playerId = room.players[0].id;
      const card = room.playCard(playerId, 0);
      expect(room.trick).toHaveLength(1);
      expect(room.trick[0]).toEqual({ playerId, card });
    });

    it('should advance currentTurn after a valid play', () => {
      const playerId = room.players[0].id;
      room.playCard(playerId, 0);
      expect(room.currentTurn).toBe(1);
    });

    it('should wrap currentTurn around after player 3 plays', () => {
      room.playCard(room.players[0].id, 0);
      room.playCard(room.players[1].id, 0);
      room.playCard(room.players[2].id, 0);
      room.playCard(room.players[3].id, 0);
      expect(room.currentTurn).toBe(0);
    });

    it('should return null if it is not the player turn', () => {
      const wrongPlayer = room.players[1].id;
      const result = room.playCard(wrongPlayer, 0);
      expect(result).toBeNull();
    });

    it('should not modify trick on invalid turn', () => {
      const wrongPlayer = room.players[1].id;
      room.playCard(wrongPlayer, 0);
      expect(room.trick).toHaveLength(0);
    });

    it('should remove the card from the player hand', () => {
      const player = room.players[0];
      const handSize = player.hand.length;
      room.playCard(player.id, 0);
      expect(player.hand).toHaveLength(handSize - 1);
    });
  });
});

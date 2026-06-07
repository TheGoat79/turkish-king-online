const Player = require('../Player');
const Card = require('../Card');

describe('Player', () => {
  describe('constructor', () => {
    it('should set id and default name', () => {
      const player = new Player('abc');
      expect(player.id).toBe('abc');
      expect(player.name).toBe('Player');
    });

    it('should accept a custom name', () => {
      const player = new Player('abc', 'Alice');
      expect(player.name).toBe('Alice');
    });

    it('should initialize with empty hand, zero score, and not ready', () => {
      const player = new Player('abc');
      expect(player.hand).toEqual([]);
      expect(player.score).toBe(0);
      expect(player.isReady).toBe(false);
    });
  });

  describe('playCard()', () => {
    it('should remove and return the card at the given index', () => {
      const player = new Player('abc');
      const card0 = new Card('♠', 'A');
      const card1 = new Card('♥', 'K');
      const card2 = new Card('♦', '5');
      player.hand = [card0, card1, card2];

      const played = player.playCard(1);
      expect(played).toBe(card1);
      expect(player.hand).toEqual([card0, card2]);
    });

    it('should return undefined for out-of-bounds index', () => {
      const player = new Player('abc');
      player.hand = [new Card('♠', '2')];

      const played = player.playCard(5);
      expect(played).toBeUndefined();
    });

    it('should handle playing the last card', () => {
      const player = new Player('abc');
      const card = new Card('♣', '7');
      player.hand = [card];

      const played = player.playCard(0);
      expect(played).toBe(card);
      expect(player.hand).toHaveLength(0);
    });
  });
});

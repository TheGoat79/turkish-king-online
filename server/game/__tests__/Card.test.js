const Card = require('../Card');

describe('Card', () => {
  describe('constructor', () => {
    it('should store suit and rank', () => {
      const card = new Card('♠', 'A');
      expect(card.suit).toBe('♠');
      expect(card.rank).toBe('A');
    });
  });

  describe('value()', () => {
    it('should return 14 for Ace', () => {
      expect(new Card('♠', 'A').value()).toBe(14);
    });

    it('should return 13 for King', () => {
      expect(new Card('♥', 'K').value()).toBe(13);
    });

    it('should return 12 for Queen', () => {
      expect(new Card('♦', 'Q').value()).toBe(12);
    });

    it('should return 11 for Jack', () => {
      expect(new Card('♣', 'J').value()).toBe(11);
    });

    it('should return numeric value for number cards', () => {
      expect(new Card('♠', '2').value()).toBe(2);
      expect(new Card('♠', '5').value()).toBe(5);
      expect(new Card('♠', '10').value()).toBe(10);
    });
  });

  describe('toString()', () => {
    it('should return rank followed by suit', () => {
      expect(new Card('♠', 'A').toString()).toBe('A♠');
      expect(new Card('♥', '10').toString()).toBe('10♥');
    });
  });
});

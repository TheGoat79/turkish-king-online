const Deck = require('../Deck');
const Card = require('../Card');

describe('Deck', () => {
  describe('constructor', () => {
    it('should create 52 cards', () => {
      const deck = new Deck();
      expect(deck.cards).toHaveLength(52);
    });

    it('should contain all four suits', () => {
      const deck = new Deck();
      const suits = new Set(deck.cards.map(c => c.suit));
      expect(suits).toEqual(new Set(['♠', '♥', '♦', '♣']));
    });

    it('should contain all 13 ranks per suit', () => {
      const deck = new Deck();
      const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
      for (const suit of ['♠', '♥', '♦', '♣']) {
        const suitRanks = deck.cards.filter(c => c.suit === suit).map(c => c.rank);
        expect(suitRanks.sort()).toEqual(ranks.sort());
      }
    });

    it('should create Card instances', () => {
      const deck = new Deck();
      deck.cards.forEach(card => {
        expect(card).toBeInstanceOf(Card);
      });
    });
  });

  describe('shuffle()', () => {
    it('should keep the same number of cards', () => {
      const deck = new Deck();
      deck.shuffle();
      expect(deck.cards).toHaveLength(52);
    });

    it('should change the order of cards', () => {
      const deck1 = new Deck();
      const deck2 = new Deck();
      deck2.shuffle();

      const order1 = deck1.cards.map(c => c.toString());
      const order2 = deck2.cards.map(c => c.toString());

      // Extremely unlikely for a shuffled deck to match the original
      expect(order1).not.toEqual(order2);
    });

    it('should retain all original cards', () => {
      const deck = new Deck();
      const before = deck.cards.map(c => c.toString()).sort();
      deck.shuffle();
      const after = deck.cards.map(c => c.toString()).sort();
      expect(after).toEqual(before);
    });
  });

  describe('deal()', () => {
    it('should distribute all cards to players', () => {
      const deck = new Deck();
      const players = [
        { hand: [] },
        { hand: [] },
        { hand: [] },
        { hand: [] }
      ];
      deck.deal(players);

      expect(deck.cards).toHaveLength(0);
      const totalDealt = players.reduce((sum, p) => sum + p.hand.length, 0);
      expect(totalDealt).toBe(52);
    });

    it('should deal 13 cards to each of 4 players', () => {
      const deck = new Deck();
      const players = [
        { hand: [] },
        { hand: [] },
        { hand: [] },
        { hand: [] }
      ];
      deck.deal(players);

      players.forEach(p => {
        expect(p.hand).toHaveLength(13);
      });
    });

    it('should deal in round-robin order', () => {
      const deck = new Deck();
      const originalLast = deck.cards[deck.cards.length - 1].toString();
      const players = [
        { hand: [] },
        { hand: [] }
      ];
      deck.deal(players);

      // First card dealt (popped from end) goes to player 0, second to player 1, etc.
      expect(players[0].hand[0].toString()).toBe(originalLast);
    });
  });
});

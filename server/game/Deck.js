const Card = require('./Card');

class Deck {
  constructor() {
    this.cards = [];
    const suits = ['♠','♥','♦','♣'];
    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

    for (const s of suits) {
      for (const r of ranks) {
        this.cards.push(new Card(s, r));
      }
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(players) {
    if (!players || players.length === 0) {
      throw new Error('Cannot deal to an empty player list');
    }
    let p = 0;
    while (this.cards.length) {
      players[p].hand.push(this.cards.pop());
      p = (p + 1) % players.length;
    }
  }
}

module.exports = Deck;
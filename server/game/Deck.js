const Card = require('./Card');
const { SUITS, RANKS } = require('./constants');

class Deck {
  constructor() {
    this.cards = [];

    for (const s of SUITS) {
      for (const r of RANKS) {
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
    let p = 0;
    while (this.cards.length) {
      players[p].hand.push(this.cards.pop());
      p = (p + 1) % players.length;
    }
  }
}

module.exports = Deck;
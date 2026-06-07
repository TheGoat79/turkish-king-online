const { FACE_VALUES } = require('./constants');

class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
  }

  value() {
    return FACE_VALUES[this.rank] || parseInt(this.rank);
  }

  toString() {
    return `${this.rank}${this.suit}`;
  }
}

module.exports = Card;
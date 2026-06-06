class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
  }

  value() {
    const v = {
      J: 11,
      Q: 12,
      K: 13,
      A: 14
    };
    return v[this.rank] || parseInt(this.rank);
  }

  toString() {
    return `${this.rank}${this.suit}`;
  }
}

module.exports = Card;
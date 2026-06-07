class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name && String(name).trim() ? String(name).trim().slice(0, 20) : 'Player';
    this.hand = [];
    this.score = 0;
    this.tricksWon = 0;
    this.isReady = false;
  }

  playCard(index) {
    return this.hand.splice(index, 1)[0];
  }
}

module.exports = Player;

class Player {
  constructor(id, name = "Player") {
    this.id = id;
    this.name = name;
    this.hand = [];
    this.score = 0;
    this.isReady = false;
  }

  playCard(index) {
    return this.hand.splice(index, 1)[0];
  }
}

module.exports = Player;
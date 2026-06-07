const Deck = require('./Deck');
const Player = require('./Player');

class GameRoom {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.players = [];
    this.deck = null;
    this.trick = [];
    this.currentTurn = 0;
    this.started = false;
    this.scores = {};
  }

  addPlayer(id) {
    if (this.players.length >= 4) return false;
    if (this.players.some(p => p.id === id)) return false;

    const player = new Player(id);
    this.players.push(player);
    this.scores[id] = 0;

    return true;
  }

  removePlayer(id) {
    const idx = this.players.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.players.splice(idx, 1);
      delete this.scores[id];
    }
  }

  startGame() {
    if (this.players.length !== 4) return false;

    this.deck = new Deck();
    this.deck.shuffle();
    this.deck.deal(this.players);

    this.started = true;
    this.currentTurn = 0;

    return true;
  }

  playCard(playerId, cardIndex) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || playerIndex !== this.currentTurn) return null;
    if (!this.started) return null;

    const player = this.players[playerIndex];
    if (cardIndex < 0 || cardIndex >= player.hand.length) return null;

    const card = player.playCard(cardIndex);
    this.trick.push({ playerId, card });

    this.currentTurn = (this.currentTurn + 1) % 4;

    return card;
  }
}

module.exports = GameRoom;
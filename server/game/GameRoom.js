const Deck = require('./Deck');
const Player = require('./Player');

const MAX_PLAYERS = 4;

class GameRoom {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.players = [];
    this.deck = null;
    this.trick = [];
    this.leadSuit = null;
    this.currentTurn = 0;
    this.started = false;
  }

  addPlayer(id, name) {
    if (this.players.length >= MAX_PLAYERS) return false;
    if (this.players.some(p => p.id === id)) return true;

    this.players.push(new Player(id, name));
    return true;
  }

  removePlayer(id) {
    const index = this.players.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.players.splice(index, 1);

    // A game in progress can't continue with fewer than 4 players.
    if (this.started) this.reset();
    else if (this.currentTurn >= this.players.length) this.currentTurn = 0;

    return true;
  }

  reset() {
    this.deck = null;
    this.trick = [];
    this.leadSuit = null;
    this.currentTurn = 0;
    this.started = false;
    this.players.forEach(p => {
      p.hand = [];
      p.tricksWon = 0;
    });
  }

  startGame() {
    if (this.players.length !== MAX_PLAYERS) return false;

    this.deck = new Deck();
    this.deck.shuffle();
    this.players.forEach(p => {
      p.hand = [];
      p.tricksWon = 0;
    });
    this.deck.deal(this.players);

    this.trick = [];
    this.leadSuit = null;
    this.currentTurn = 0;
    this.started = true;

    return true;
  }

  get currentPlayer() {
    return this.players[this.currentTurn] || null;
  }

  /**
   * Attempt to play the card at `cardIndex` from `playerId`'s hand.
   * Returns a result object describing what happened so the socket layer
   * can broadcast it. On an illegal move returns { ok: false, error }.
   */
  playCard(playerId, cardIndex) {
    if (!this.started) return { ok: false, error: 'Game has not started' };

    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return { ok: false, error: 'You are not in this game' };
    if (playerIndex !== this.currentTurn) return { ok: false, error: 'Not your turn' };

    const player = this.players[playerIndex];
    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      return { ok: false, error: 'Invalid card' };
    }

    const card = player.hand[cardIndex];

    // Must follow the led suit when able to.
    if (this.leadSuit && card.suit !== this.leadSuit) {
      const canFollow = player.hand.some(c => c.suit === this.leadSuit);
      if (canFollow) return { ok: false, error: `You must follow ${this.leadSuit}` };
    }

    player.hand.splice(cardIndex, 1);
    if (this.trick.length === 0) this.leadSuit = card.suit;
    this.trick.push({ playerId, card });

    const result = { ok: true, playerId, card };

    if (this.trick.length === MAX_PLAYERS) {
      const winnerId = this.resolveTrick();
      result.trickComplete = true;
      result.trickWinner = winnerId;
      result.roundOver = this.players.every(p => p.hand.length === 0);
      if (result.roundOver) {
        this.scoreRound();
        result.scores = this.scoreboard();
      }
    } else {
      this.currentTurn = (this.currentTurn + 1) % MAX_PLAYERS;
    }

    return result;
  }

  // Highest card of the led suit takes the trick; that player leads next.
  resolveTrick() {
    let best = this.trick[0];
    for (const play of this.trick) {
      if (play.card.suit === this.leadSuit && play.card.value() > best.card.value()) {
        best = play;
      }
    }

    const winner = this.players.find(p => p.id === best.playerId);
    if (winner) winner.tricksWon += 1;

    this.trick = [];
    this.leadSuit = null;
    this.currentTurn = this.players.findIndex(p => p.id === best.playerId);

    return best.playerId;
  }

  // Simplified scoring: each trick taken in the round is worth one point.
  scoreRound() {
    this.players.forEach(p => { p.score += p.tricksWon; });
    this.started = false;
  }

  scoreboard() {
    return this.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      tricksWon: p.tricksWon
    }));
  }

  // Public snapshot of room state safe to broadcast to every client.
  publicState() {
    return {
      roomCode: this.roomCode,
      started: this.started,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        tricksWon: p.tricksWon,
        cardsLeft: p.hand.length
      })),
      currentTurn: this.started ? this.currentPlayer?.id ?? null : null,
      leadSuit: this.leadSuit,
      trick: this.trick
    };
  }
}

module.exports = GameRoom;

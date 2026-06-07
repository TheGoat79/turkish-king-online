const socket = io();

let roomCode = null;
let hand = [];
let myId = null;
let currentTurn = null;

const SEAT_ORDER = ['south', 'west', 'north', 'east'];
const ROOM_CODE_RE = /^[A-Z0-9]{3,8}$/;

socket.on('connect', () => { myId = socket.id; });

function $(id) { return document.getElementById(id); }

function playerName() {
  const el = $('name');
  return el && el.value.trim() ? el.value.trim() : 'Player';
}

function updateRoomCode() {
  const el = $('room-code');
  if (el) el.textContent = roomCode || '---';
}

function copyRoomCode() {
  if (roomCode) navigator.clipboard.writeText(roomCode);
}

function createCardElement(card, extraClass) {
  const div = document.createElement('div');
  div.className = 'card' + (extraClass ? ' ' + extraClass : '');

  const rankDiv = document.createElement('div');
  rankDiv.textContent = card.rank;

  const suitDiv = document.createElement('div');
  suitDiv.className = 'suit';
  suitDiv.textContent = card.suit;

  div.appendChild(rankDiv);
  div.appendChild(suitDiv);
  return div;
}

function createRoom() {
  roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  socket.emit('create-room', { roomCode, name: playerName() });
  updateRoomCode();
}

function joinRoom() {
  const code = $('room').value.trim().toUpperCase();
  if (!ROOM_CODE_RE.test(code)) {
    setStatus('⚠ Invalid room code. Use 3-8 letters/numbers.');
    return;
  }
  roomCode = code;
  socket.emit('join-room', { roomCode, name: playerName() });
  updateRoomCode();
}

function startGame() {
  socket.emit('start-game');
}

function renderHand() {
  const handDiv = $('hand');
  handDiv.innerHTML = '';
  const myTurn = currentTurn === myId;
  hand.forEach((card, index) => {
    const div = createCardElement(card, myTurn ? '' : 'disabled');
    if (myTurn) div.onclick = () => socket.emit('play-card', { index });
    handDiv.appendChild(div);
  });
}

function renderSeats(players) {
  SEAT_ORDER.forEach(seat => {
    const el = document.querySelector('.' + seat + '-player');
    if (el) { el.classList.remove('active'); el.style.visibility = 'hidden'; }
  });

  const myIndex = Math.max(0, players.findIndex(p => p.id === myId));
  players.forEach((p, i) => {
    const seat = SEAT_ORDER[(i - myIndex + players.length) % players.length];
    const el = document.querySelector('.' + seat + '-player');
    if (!el) return;
    el.style.visibility = 'visible';
    el.querySelector('.avatar').textContent = (p.name || '?').charAt(0).toUpperCase();
    el.querySelector('.seat-name').textContent =
      `${p.name}${p.id === myId ? ' (you)' : ''} · ${p.tricksWon}\u{1F0CF}`;
    if (p.id === currentTurn) el.classList.add('active');
  });
}

function renderScoreboard(players) {
  const board = $('scoreboard');
  if (!board) return;
  board.innerHTML = '';
  players.forEach(p => {
    const row = document.createElement('div');
    row.className = 'score-row' + (p.id === currentTurn ? ' active' : '');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${p.name}${p.id === myId ? ' (you)' : ''}`;

    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = `${p.score} pts · ${p.tricksWon} tricks`;

    row.appendChild(nameSpan);
    row.appendChild(scoreSpan);
    board.appendChild(row);
  });
}

function renderTrick(trick) {
  const table = $('table');
  if (!table) return;
  table.innerHTML = '';
  trick.forEach(({ card }) => {
    const div = createCardElement(card, 'table-card');
    table.appendChild(div);
  });
}

function setStatus(text) {
  const el = $('status');
  if (el) el.textContent = text;
}

socket.on('room-created', code => { roomCode = code; updateRoomCode(); });
socket.on('room-joined', code => { roomCode = code; updateRoomCode(); });
socket.on('your-hand', serverHand => { hand = serverHand; renderHand(); });
socket.on('game-started', () => setStatus('Game started!'));

socket.on('state', state => {
  $('player-count').textContent = state.players.length;
  currentTurn = state.currentTurn;
  if (!state.started) hand = [];
  renderSeats(state.players);
  renderScoreboard(state.players);
  renderTrick(state.trick);
  renderHand();

  if (!state.started) {
    setStatus(state.players.length < 4
      ? `Waiting for players (${state.players.length}/4)`
      : 'Ready \u2014 press Start Game');
  } else {
    const turnPlayer = state.players.find(p => p.id === state.currentTurn);
    setStatus(state.currentTurn === myId
      ? 'Your turn'
      : `${turnPlayer ? turnPlayer.name : '...'}'s turn`);
  }
});

socket.on('trick-won', ({ winnerId }) => {
  setStatus(winnerId === myId ? 'You won the trick!' : 'Trick taken');
});

socket.on('round-over', ({ scores }) => {
  const top = [...scores].sort((a, b) => b.score - a.score)[0];
  setStatus(`Round over \u2014 leader: ${top.name} (${top.score} pts)`);
});

socket.on('error-message', msg => {
  setStatus('\u26A0 ' + String(msg).slice(0, 200));
});

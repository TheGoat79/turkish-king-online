const socket = io();
let roomCode = null;
let hand = [];

const ROOM_CODE_RE = /^[A-Z0-9]{3,8}$/;

function updateRoomCode() {
  const el = document.getElementById('room-code');
  if (el) el.textContent = roomCode || '---';
}

function updatePlayerCount(count) {
  const el = document.getElementById('player-count');
  if (el) el.textContent = count;
}

function copyRoomCode() {
  if (roomCode) navigator.clipboard.writeText(roomCode);
}

function createCardElement(card) {
  const div = document.createElement('div');
  div.className = 'card';

  const rankDiv = document.createElement('div');
  rankDiv.textContent = card.rank;

  const suitDiv = document.createElement('div');
  suitDiv.textContent = card.suit;

  div.appendChild(rankDiv);
  div.appendChild(suitDiv);
  return div;
}

function createRoom() {
  roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  socket.emit('create-room', roomCode);
  updateRoomCode();
}

function joinRoom() {
  const input = document.getElementById('room').value.trim().toUpperCase();
  if (!ROOM_CODE_RE.test(input)) {
    alert('Invalid room code. Use 3-8 uppercase letters/numbers.');
    return;
  }
  roomCode = input;
  socket.emit('join-room', roomCode);
  updateRoomCode();
}

function startGame() { socket.emit('start-game', roomCode); }

function renderHand() {
  const handDiv = document.getElementById('hand');
  handDiv.innerHTML = '';
  hand.forEach((card, index) => {
    const div = createCardElement(card);
    div.onclick = () => socket.emit('play-card', { roomCode, index });
    handDiv.appendChild(div);
  });
}

socket.on('room-created', (code) => { roomCode = code; updateRoomCode(); });
socket.on('player-count', (count) => { updatePlayerCount(count); });
socket.on('your-hand', (serverHand) => { hand = serverHand; renderHand(); });
socket.on('card-played', (data) => {
  const table = document.getElementById('table');
  const div = createCardElement(data.card);
  table.appendChild(div);
});
socket.on('error-message', (msg) => {
  const safe = String(msg).slice(0, 200);
  alert(safe);
});
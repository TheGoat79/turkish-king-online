const SERVER_URL = window.SERVER_URL || "http://localhost:3000";
const socket = io(SERVER_URL);

let roomCode = null;
let hand = [];

function createRoom() {
  roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  socket.emit('create-room', roomCode);
  document.getElementById('status').innerText = 'Room: ' + roomCode;
}

function joinRoom() {
  roomCode = document.getElementById('room').value;
  socket.emit('join-room', roomCode);
  document.getElementById('status').innerText = 'Joined: ' + roomCode;
}

function startGame() {
  socket.emit('start-game', roomCode);
}

function renderHand() {
  const handDiv = document.getElementById('hand');
  handDiv.innerHTML = '';

  hand.forEach((card, index) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerText = card.rank + card.suit;

    div.onclick = () => {
      socket.emit('play-card', { roomCode, index });
    };

    handDiv.appendChild(div);
  });
}

socket.on('room-created', (code) => {
  roomCode = code;
  document.getElementById('status').innerText = 'Room created: ' + code;
});

socket.on('player-count', (count) => {
  document.getElementById('status').innerText = 'Players: ' + count;
});

socket.on('your-hand', (serverHand) => {
  hand = serverHand;
  renderHand();
});

socket.on('card-played', (data) => {
  const table = document.getElementById('table');
  const div = document.createElement('div');
  div.innerText = data.card.rank + data.card.suit;
  table.appendChild(div);
});

socket.on('error-message', (msg) => alert(msg));
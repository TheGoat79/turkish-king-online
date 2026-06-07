const socket = io();
let roomCode = null;
let hand = [];

function updateRoomCode(){const el=document.getElementById('room-code');if(el)el.innerText=roomCode||'---';}
function updatePlayerCount(count){const el=document.getElementById('player-count');if(el)el.innerText=count;}
function copyRoomCode(){if(roomCode) navigator.clipboard.writeText(roomCode);}

function createRoom() {
  roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  socket.emit('create-room', roomCode);
  updateRoomCode();
}

function joinRoom() {
  roomCode = document.getElementById('room').value;
  socket.emit('join-room', roomCode);
  updateRoomCode();
}

function startGame() { socket.emit('start-game', roomCode); }

function renderHand() {
 const handDiv=document.getElementById('hand'); handDiv.innerHTML='';
 hand.forEach((card,index)=>{
  const div=document.createElement('div');
  div.className='card';
  div.innerHTML=`<div>${card.rank}</div><div>${card.suit}</div>`;
  div.onclick=()=>socket.emit('play-card',{roomCode,index});
  handDiv.appendChild(div);
 });
}

socket.on('room-created',(code)=>{roomCode=code;updateRoomCode();});
socket.on('player-count',(count)=>{updatePlayerCount(count);});
socket.on('your-hand',(serverHand)=>{hand=serverHand;renderHand();});
socket.on('card-played',(data)=>{
 const table=document.getElementById('table');
 const div=document.createElement('div');
 div.className='card';
 div.innerHTML=`<div>${data.card.rank}</div><div>${data.card.suit}</div>`;
 table.appendChild(div);
});
socket.on('error-message',(msg)=>alert(msg));
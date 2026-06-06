const socket = io();
function createRoom(){const code=Math.random().toString(36).substring(2,7).toUpperCase();socket.emit('create-room',code);} 
function joinRoom(){socket.emit('join-room',document.getElementById('room').value);} 
socket.on('room-created',(code)=>document.getElementById('status').innerText='Room: '+code);
socket.on('player-count',(count)=>document.getElementById('status').innerText='Players: '+count);
socket.on('error-message',(msg)=>alert(msg));
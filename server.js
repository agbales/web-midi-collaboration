var express = require('express');
var app = express();
const port = process.env.PORT || 8080;
var server = app.listen(port);

app.use(express.static('public'));

var socket = require('socket.io');
var io = socket(server);

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  console.log('new connection from:' + socket.id);

  socket.on('midi', midiMsg);
  function midiMsg(data) {
    socket.broadcast.emit('midi', data);
    console.log(data);
  }
}

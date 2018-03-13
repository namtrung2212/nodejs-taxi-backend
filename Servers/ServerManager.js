var config= require ("./GlobalConfig");
var express = require('express');
var app     = express();
var server  = require('http').createServer(app);
server.listen(config.ManagerServerPort);

var serverNames = new Map();
var io = require('socket.io')(server);
io.sockets.on('connection', function(socket) {

    socket.on('disconnect', function() {
          serverNames.forEach(function(value, key) {
              if(value===socket.id){
                  console.log(key + ' disconnected.');
                  serverNames.delete(key);
                  return;
              }
          }, serverNames);

    });

    socket.on('Login', function (data) {
        serverNames.set(data.name,socket.id);
        console.log(data.name + ' connected with Id = ' + socket.id);
    });
});


/*
    socket.on('requestDriver', function(id, msg){
        socket.broadcast.to(id).emit('neworder', msg);
    });
*/

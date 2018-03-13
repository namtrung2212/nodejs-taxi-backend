var serverConfig= require ("./ServerConfig");
var express = require('express');
var app     = express();
var server  = require('http').createServer(app);
server.listen(serverConfig.ChatServerPort);


var userIDs = new Map();
var driverIDs = new Map();

var io = require('socket.io')(server);
io.sockets.on('connection', function(socket) {

      socket.on('UserLogin', function (data) {
          userIDs.set(data.UserID,socket.id);
          console.log('User : ' + data.UserID + ' connected with Id = ' + socket.id);
          socket.emit('UserLogged', socket.id);
      });

      socket.on('DriverLogin', function (data) {
          driverIDs.set(data.DriverID,socket.id);
          console.log('Driver : ' + data.DriverID + ' connected with Id = ' + socket.id);
          socket.emit('DriverLogged', socket.id);
      });

      socket.on('disconnect', function() {

          userIDs.forEach(function(value, key) {
              if(value===socket.id){
                  console.log("User :" + key + ' disconnected.');
                  userIDs.delete(key);
                  return;
              }
          }, userIDs);

          driverIDs.forEach(function(value, key) {
              if(value===socket.id){
                  console.log("Driver :" + key + ' disconnected.');
                  driverIDs.delete(key);
                  return;
              }
          }, driverIDs);

      });

      socket.on('UserChatToDriver', function (data) {

          var driverSocketId =  driverIDs.get(data.DriverID);
          socket.broadcast.to(driverSocketId).emit('UserChatToDriver', data);

      });

      socket.on('DriverChatToUser', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverChatToUser', data);

      });

      socket.on('UserChatToGroup', function (data) {
          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('UserChatToGroup', data);

      });

});

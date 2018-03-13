var serverConfig= require ("./ServerConfig");
var express = require('express');
var app     = express();
var server  = require('http').createServer(app);
server.listen(serverConfig.TaxiNotifyServerPort);


var userIDs = new Map();
var driverIDs = new Map();
var activeDriverIDs = new Map();
var activeUserIDs = new Map();
var vehicleDriverIDs = new Map();


app.get("/Socket/isExistUser",function(req,res){

        var userSocketId =  driverIDs.get(req.query["UserID"]);
        if(userSocketId != null)
              res.json(1);
        else
              res.json(-1);
});

app.get("/Socket/isExistDriver",function(req,res){

        var driverSocketId =  driverIDs.get(req.query["DriverID"]);
        if(driverSocketId != null)
              res.json(1);
        else
              res.json(-1);
});

app.get("/Socket/isUserInForeground",function(req,res){

        var obj =  activeUserIDs.get(req.query["UserID"]);
        if(obj != null)
              res.json(1);
        else
              res.json(-1);
});

app.get("/Socket/isDriverInForeground",function(req,res){

        var obj =  activeDriverIDs.get(req.query["DriverID"]);
        if(obj != null)
              res.json(1);
        else
              res.json(-1);
});


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


          vehicleDriverIDs.forEach(function(driverList, vehicleID) {

                      driverList.forEach(function(value, key) {
                          if(value===socket.id){
                              driverList.delete(key);
                              return;
                          }
                      }, driverList);

          }, vehicleDriverIDs);

      });

      socket.on('CheckDriverAppInForeground', function (data) {

          activeDriverIDs.delete(data.DriverID);

          var driverSocketId =  driverIDs.get(data.DriverID);
          socket.broadcast.to(driverSocketId).emit('CheckAppInForeground', data);

      });
      socket.on('DriverAppInForeground', function (data) {
          activeDriverIDs.set(data.DriverID,1);
      });
      socket.on('DriverAppInBackground', function (data) {
          activeDriverIDs.delete(data.DriverID);
      });

      socket.on('CheckUserAppInForeground', function (data) {

          activeUserIDs.delete(data.UserID);

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('CheckAppInForeground', data);

      });
      socket.on('UserAppInForeground', function (data) {
          activeUserIDs.set(data.UserID,1);
      });
      socket.on('UserAppInBackground', function (data) {
          activeUserIDs.delete(data.UserID);
      });

      socket.on('DriverResetVehicle', function (data) {

          vehicleDriverIDs.forEach(function(driverList, vehicleID) {

                      driverList.forEach(function(value, key) {
                          if(value===socket.id){
                              driverList.delete(key);
                              return;
                          }
                      }, driverList);

          }, vehicleDriverIDs);

          var drivers =  vehicleDriverIDs.get(data.VehicleID);
          if(!drivers){
              drivers = new Map();
              vehicleDriverIDs.set(data.VehicleID,drivers);
          }

          drivers.set(data.DriverID,socket.id);

      });

      socket.on('UserRequestTaxi', function (data) {
          var driverSocketId =  driverIDs.get(data.DriverID);
          socket.broadcast.to(driverSocketId).emit('UserRequestTaxi', data);

          console.log("User request to Driver :" + driverSocketId );
      });

      socket.on('UserCancelRequest', function (data) {

          var driverSocketId =  driverIDs.get(data.DriverID);
          socket.broadcast.to(driverSocketId).emit('UserCancelRequest', data);

      });

      socket.on('DriverBidding', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverBidding', data);

      });

      socket.on('UserAcceptBidding', function (data) {

          var driverSocketId =  driverIDs.get(data.DriverID);
          socket.broadcast.to(driverSocketId).emit('UserAcceptBidding', data);

      });

      socket.on('UserCancelAcceptingBidding', function (data) {

          var driverSocketId =  driverIDs.get(data.DriverID);
          socket.broadcast.to(driverSocketId).emit('UserCancelAcceptingBidding', data);

      });

      socket.on('DriverAccepted', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverAccepted', data);

      });

      socket.on('DriverRejected', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverRejected', data);

      });


      socket.on('VehicleUpdateLocation', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('VehicleUpdateLocation', data);

          var driverList =  vehicleDriverIDs.get(data.VehicleID);
          if(driverList){
            driverList.forEach(function(value, key) {
                if(key != data.DriverID){
                  socket.broadcast.to(value).emit('VehicleUpdateLocation', data);
                }
            }, driverList);
          }

      });

      socket.on('DriverVoidedBfPickup', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverVoidedBfPickup', data);

      });

      socket.on('UserVoidedBfPickup', function (data) {

          var driverSocketId =  driverIDs.get(data.DriverID);
          socket.broadcast.to(driverSocketId).emit('UserVoidedBfPickup', data);

      });

      socket.on('DriverStartPicking', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverStartPicking', data);

      });

      socket.on('DriverStartPicking', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverStartPicking', data);

      });

      socket.on('DriverAtPickupPlace', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverAtPickupPlace', data);

      });

      socket.on('UserGotThePickupNotice', function (data) {

            var driverSocketId =  driverIDs.get(data.DriverID);
            socket.broadcast.to(driverSocketId).emit('UserGotThePickupNotice', data);

      });

      socket.on('DriverStartedTrip', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverStartedTrip', data);

      });

      socket.on('DriverVoidedAfPickup', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverVoidedAfPickup', data);

      });

      socket.on('UserVoidedAfPickup', function (data) {

          var driverSocketId =  driverIDs.get(data.DriverID);
          socket.broadcast.to(driverSocketId).emit('UserVoidedAfPickup', data);

      });

      socket.on('DriverFinished', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverFinished', data);

      });

      socket.on('DriverReceivedCash', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverReceivedCash', data);

      });

      socket.on('UserPaidByCard', function (data) {

          var driverSocketId =  driverIDs.get(data.DriverID);
          socket.broadcast.to(driverSocketId).emit('UserPaidByCard', data);

      });

      socket.on('UserChatToDriver', function (data) {

          console.log("UserChatToDriver");
          var driverSocketId =  driverIDs.get(data.DriverID);
          socket.broadcast.to(driverSocketId).emit('UserChatToDriver', data);

      });

      socket.on('DriverChatToUser', function (data) {

          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('DriverChatToUser', data);

      });

      socket.on('UserShouldInvalidateOrder', function (data) {
          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('UserShouldInvalidateOrder', data);

      });

      socket.on('DriverShouldInvalidateOrder', function (data) {
          var driverSocketId =  driverIDs.get(data.DriverID);
          socket.broadcast.to(driverSocketId).emit('DriverShouldInvalidateOrder', data);

      });

      socket.on('MateMemberSentRequest', function (data) {
          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('MateMemberSentRequest', data);

      });

      socket.on('HostAcceptMateMember', function (data) {
          var userSocketId =  userIDs.get(data.OrderUserID);
          socket.broadcast.to(userSocketId).emit('HostAcceptMateMember', data);

      });

      socket.on('HostRejectMateMember', function (data) {
          var userSocketId =  userIDs.get(data.OrderUserID);
          socket.broadcast.to(userSocketId).emit('HostRejectMateMember', data);

      });

      socket.on('MemberLeaveFromTripMate', function (data) {
          var userSocketId =  userIDs.get(data.UserID);
          socket.broadcast.to(userSocketId).emit('MemberLeaveFromTripMate', data);

      });

      socket.on('HostCloseTripMate', function (data) {
          var userSocketId =  userIDs.get(data.OrderUserID);
          socket.broadcast.to(userSocketId).emit('HostCloseTripMate', data);

      });
});

var serverConfig= require ("./ServerConfig");
var config= require ("../GlobalConfig");
require("mongoose").connect(config.DBAddress);

var express = require('express');
var app     = express();
var bodyParser =	require("body-parser");
var app	=	express();
app.use(bodyParser.json());

var FCM = require('fcm-push');
var serverKey = 'AAAAz45E87Q:APA91bFlTSGlLaSqYUoSFIKl33P4hvGvzObss9ORAcKSP69rvnCvm4vmVbz9ZNBLf5s6lIOJiUh4BA5xZkHrIRovEJDcoObvTPH-ADa1YYGq5bl4lj09vSXj1uGQDmQU4Dd5ZrDLgYTr1SFuJqrV93d_b6UELn8zFA';
var fcm = new FCM(serverKey);


var UserStatus     =   require("../../Models/UserStatus");
var DriverStatus     =   require("../../Models/DriverStatus");
var NotificationHelper = require('../Utils/NotificationHelper');

app.get("/FCM/updateToken",function(req,res){

      var userId = req.query.userId || null;
      var driverId = req.query.driverId || null;
      var FCMToken = req.query.FCMToken || null;

      if(userId != null && FCMToken != null){

            UserStatus.update({"User" : userId },{"FCMToken" : FCMToken},function(err,data){

            });
      }

      if(driverId != null && FCMToken != null){

            DriverStatus.update({"Driver" : driverId },{"FCMToken" : FCMToken},function(err,data){

            });
      }

      res.json("done");

});


app.get("/FCM/notify",function(req,res){

      var userId = req.query.userId || null;
      var driverId = req.query.driverId || null;
      var orderId = req.query.orderId || null;
      var notifyType = req.query.notifyType || null;

      if(userId != null && notifyType != null){
                NotificationHelper.NotifyToUserViaFCM(userId,{
                    Type: notifyType,
                    OrderID: orderId,
                    UserID: userId,
                    DriverID: driverId
                });
      }

      if(driverId != null && notifyType != null){

                NotificationHelper.NotifyToDriverViaFCM(driverId,{
                    Type: notifyType,
                    OrderID: orderId,
                    UserID: userId,
                    DriverID: driverId
                });
      }

      res.json("done");

});


var seaport = require('seaport');
var ports = seaport.connect(config.SeaportServer, config.SeaportPort);
ports.setMaxListeners(5000);

var port=ports.register("FCMServer");

console.log("listening on port " + port);
app.listen(port);

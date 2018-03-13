var request = require('request');
var serverConfig= require ("./ServerConfig");
var config= require ("../GlobalConfig");
var GoogleHelper = require('../Utils/GoogleHelper');
var express	=	require("express");
var bodyParser =	require("body-parser");
var app	=	express();
app.use(bodyParser.json());

app.get("/googlemap/getFullAddress",function(req,res){

      var lat = req.query["lat"];
      var long = req.query["long"];

      GoogleHelper.getFullAddress(lat,long).then(function (data) {

            res.json(data);

      });

});


app.get("/googlemap/getAddress",function(req,res){

      var lat = req.query["lat"];
      var long = req.query["long"];

      GoogleHelper.getAddress(lat,long).then(function (data) {

            res.json(data);

      });

});

app.get("/googlemap/getDirections",function(req,res){

      var sourceLat = req.query["orgLat"];
      var sourceLong = req.query["orgLong"];
      var destLat = req.query["destLat"];
      var destLong = req.query["destLong"];

      GoogleHelper.getDirections(sourceLat,sourceLong,destLat,destLong).then(function (data) {

            res.json(data);

      });

});


app.get("/googlemap/getDistance",function(req,res){

        var sourceLat = req.query["orgLat"];
        var sourceLong = req.query["orgLong"];
        var destLat = req.query["destLat"];
        var destLong = req.query["destLong"];

        GoogleHelper.getDistance(sourceLat,sourceLong,destLat,destLong).then(function (distance) {

              res.json(distance);

        });

});

app.get("/googlemap/getDuration",function(req,res){

        var sourceLat = req.query["orgLat"];
        var sourceLong = req.query["orgLong"];
        var destLat = req.query["destLat"];
        var destLong = req.query["destLong"];

        GoogleHelper.getDuration(sourceLat,sourceLong,destLat,destLong).then(function (duration) {

                res.json(duration);

        });

});

var seaport = require('seaport');
var ports = seaport.connect(config.SeaportServer, config.SeaportPort);
ports.setMaxListeners(5000);
var port=ports.register("GoogleMapApp");
app.listen(port);



// Connect to Server Manager
var socket = require('socket.io-client')(config.ManagerServer+":"+config.ManagerServerPort);
socket.on('connect', function(){
    console.log("Conected to Server Manager with Id = " + socket.id);
    socket.emit('Login', { name: 'QueryServer' });
});


const cluster = require('cluster');
if (cluster.isMaster) {

  for (var i = 0; i < serverConfig.WorkerNumber-1; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });


}

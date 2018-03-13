
var serverConfig= require ("./ServerConfig");
var config= require ("../GlobalConfig");

require("mongoose").connect(config.DBAddress);
var Driver     =   require("../../Models/Driver");
var User     =   require("../../Models/User");

var express = require('express');
var app  =   express();
var bodyParser  =   require("body-parser");
app.use(bodyParser.json());

var jwt    = require('jsonwebtoken');
app.set('superSecret', serverConfig.Secret);

var router      =   express.Router();

      router.post("/Authenticate/User/GetNewToken", function(req, res) {

              User.findById(req.body.id, function(err,user){

                  if (err) {
                      res.json({ success: false, message: err });
                      return;
                  }

                  if (!user) {
                      res.json({ success: false, message: 'Authentication failed. User not found.' });

                  } else if (user) {

                      var token = jwt.sign(user, app.get('superSecret'), {
                        expiresIn : 60*60*24 // expires in 24 hours
                      });

                      res.json({
                        success: true,
                        message: 'Enjoy your token!',
                        token: token
                      });
                  }

              });

      });

      router.post("/Authenticate/Driver/GetNewToken", function(req, res) {

              Driver.findById(req.body.id, function(err,driver){

                  if (err) {
                      res.json({ success: false, message: err });
                      return;
                  }

                  if (!driver) {
                      res.json({ success: false, message: 'Authentication failed. Driver not found.' });

                  } else if (driver) {

                      var token = jwt.sign(driver, app.get('superSecret'), {
                        expiresIn : 60*60*24 // expires in 24 hours
                      });

                      res.json({
                        success: true,
                        message: 'Enjoy your token!',
                        token: token
                      });
                  }

              });

      });


      router.post('/Authenticate/User/CheckToken', function(req, res) {

            User.findById(req.body.id, function(err,user){

                if (err) {
                    res.json({ success: false, message: err });
                    return;
                }

                if (!user) {
                    res.json({ success: false, message: 'Authentication failed. User not found.' });

                } else if (user) {

                    var token = req.body.token;
                    jwt.verify(token, app.get('superSecret'), function(err, decoded) {

                          if (err) {
                            return res.json({ success: false, message: 'Failed to authenticate token.' });

                          } else {
                            res.json({ success: true, message: 'Token is valid.' });

                          }

                    });
                }

           });

      });


      router.post('/Authenticate/Driver/CheckToken', function(req, res) {

            Driver.findById(req.body.id, function(err,driver){

                if (err) {
                    res.json({ success: false, message: err });
                    return;
                }

                if (!driver) {
                    res.json({ success: false, message: 'Authentication failed. Driver not found.' });

                } else if (driver) {

                    var token = req.body.token;
                    jwt.verify(token, app.get('superSecret'), function(err, decoded) {

                          if (err) {
                            return res.json({ success: false, message: 'Failed to authenticate token.' });

                          } else {
                            res.json({ success: true, message: 'Token is valid.' });

                          }

                    });
                }

           });

      });

app.use('/',router);

var seaport = require('seaport');
var ports = seaport.connect(config.SeaportServer, config.SeaportPort);
ports.setMaxListeners(5000);
var port=ports.register("AuthenticateApp");
app.listen(port);
console.log("Port : " + port );


// Connect to Server Manager
var socket = require('socket.io-client')(config.ManagerServer+":"+config.ManagerServerPort);
socket.on('connect', function(){
    console.log("Conected to Server Manager with Id = " + socket.id);
    socket.emit('Login', { name: 'AuthenticateServer' });
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

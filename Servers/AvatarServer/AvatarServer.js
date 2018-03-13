var serverConfig= require ("./ServerConfig");
var config= require ("../GlobalConfig");
var express	=	require("express");
var bodyParser =	require("body-parser");
var multer	=	require('multer');
var app	=	express();
var fs = require('fs');
var Q = require('q');
var seaport = require('seaport');
var ports = seaport.connect(config.SeaportServer, config.SeaportPort);
ports.setMaxListeners(5000);
ports.setMaxListeners(500);

app.use(bodyParser.json());

require("mongoose").connect(config.DBAddress);
var Driver     =   require("../../Models/Driver");
var User     =   require("../../Models/User");


var driverStorage	=	multer.diskStorage({
      destination: function (req, file, callback) {
            callback(null, './DriverAvatars');
      },
      filename: function (req, file, callback) {
            callback(null, req.query["DriverID"]);
      }
});

var userStorage	=	multer.diskStorage({
      destination: function (req, file, callback) {
            callback(null, './UserAvatars');
      },
      filename: function (req, file, callback) {
            callback(null, req.query["UserID"]);
      }
});

var driverUploader = multer({ storage : driverStorage }).array('photo',1);
var userUploader = multer({ storage : userStorage }).array('photo',1);

app.post('/avatar/user/upload',function(req,res){
    	userUploader(req,res,function(err) {

            if(err)
                res.end("Error uploading file. : " + err);
            else
                res.end("File is uploaded");
    	});
});

app.post('/avatar/driver/upload',function(req,res){
    	driverUploader(req,res,function(err) {
            if(err)
                res.end("Error uploading file.");
            else
                res.end("File is uploaded");
    	});
});

app.get("/avatar/driver/:id",function(req,res){

        var filePath = __dirname + "/DriverAvatars/" + req.params.id;
        fs.exists(filePath, function(exists) {

            if (exists) {
                res.sendFile(filePath);

            }else{


                getDriver(req.params.id).then(function (driver){

                    console.log("driver : " + driver);
                    filePath = __dirname + "/DriverAvatars/" + driver.CitizenID;
                    res.sendFile(filePath);
                });

            }
        });

});

app.get("/avatar/user/:id",function(req,res){

        var filePath = __dirname + "/UserAvatars/" + req.params.id;
        fs.exists(filePath, function(exists) {
            if (exists) {
                res.sendFile(filePath);
            }else{

                getUser(req.params.id).then(function (user){
                    filePath = __dirname + "/UserAvatars/" + user.PhoneNo;
                    res.sendFile(filePath);
                });

            }
        });

});





function getDriver(driverId){

        var deferred = Q.defer();

        var Driver     =   require("../../Models/Driver");

        Driver.findById( driverId, function(error,result){

                console.log("error : " + error);
                console.log("result : " + result);
                if (error) {
                    deferred.reject(new Error(error));
                }
                else {

                  deferred.resolve(result);
                }
         });

       return deferred.promise;
}



function getUser(userId){

        var deferred = Q.defer();

        User.findById(userId, function(err,obj){

              if(obj){
                  deferred.resolve(obj);
              }else{
                  deferred.reject(new Error(err));
              }

       });

       return deferred.promise;
}






var port=ports.register("AvatarApp");
app.listen(port);

// Connect to Server Manager
var socket = require('socket.io-client')(config.ManagerServer+":"+config.ManagerServerPort);
socket.on('connect', function(){
    console.log("Conected to Server Manager with Id = " + socket.id);
    socket.emit('Login', { name: 'AvatarServer' });
});

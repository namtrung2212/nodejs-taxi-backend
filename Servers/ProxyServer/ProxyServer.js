var serverConfig= require ("./ServerConfig");

var express	=	require("express");
var bodyParser =	require("body-parser");

var config= require ("../GlobalConfig");
var httpProxy = require("http-proxy");
var url = require('url');
var jwt    = require('jsonwebtoken');
var seaport = require("seaport");
var ports = seaport.connect(config.SeaportServer, config.SeaportPort);
ports.setMaxListeners(5000);

var proxy = httpProxy.createProxyServer({ changeOrigin : false});
proxy.on('proxyReq', function(proxyReq, req, res, options) {

});

proxy.on('error', function (err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });
  res.end('Something went wrong. And we are reporting a custom error message.');
});

proxy.on('proxyRes', function (proxyRes, req, res) {
});


var authenticateNo = -1;
var queryNo = -1;
var insertNo = -1;
var uploadNo = -1;
var googleMapNo = -1;
var notifyNo = -1;
var totalReqCount = 0

var app	=	express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));
app.set('superSecret', serverConfig.Secret);
app.use(function (req, res) {

        if( req.url.indexOf("TestConnection") != -1){
             return res.json({ success: true, message: 'Connected'  });
        }

        totalReqCount++;

        if(!serverConfig.CheckToken || req.url.indexOf("Authenticate") != -1 ||req.url.indexOf("avatar") != -1 || req.url.indexOf("googlemap") != -1 ){
             forwardRequest(req,res);
             return;
        }


        var token =req.headers['token'];
        if(!token){
            console.log('No token provided.');
            return res.json({ success: false, message: 'No token provided.'  });
        }else{

            jwt.verify(token, app.get('superSecret'), function(err, decoded) {
                if (err) {
                    console.log('Failed to authenticate token.');
                    return res.json({ success: false, message: 'Failed to authenticate token.' });

                } else {

                      if( serverConfig.CheckHash){
                            var hash =req.headers['hash'];

                            if(!hash){
                                console.log('No hash provided.');
                                return res.json({ success: false, message: 'No hash provided.'  });

                            }else{

                                          jwt.verify(hash, app.get('superSecret'), function(err2, decoded2) {
                                              if (err2) {
                                                  console.log('Failed to authenticate hash.');
                                                  return res.json({ success: false, message: 'Failed to authenticate hash.' });

                                              } else {

                                                  forwardRequest(req,res);
                                                  return;
                                              }
                                            });
                            }

                      }else{
                            forwardRequest(req,res);
                            return;

                      }


                }

            });
        }

});

var forwardRequest = function(req,res){

      var reqURL = url.parse(req.url);
      var appname = reqURL.path.split('/')[1];

      var i=-1;
      var addresses;

      if(appname=="avatar"){
            addresses = ports.query('AvatarApp');
            if (addresses.length)
              uploadNo = (uploadNo + 1) % addresses.length;
            i=uploadNo;

      }else if(appname=="Authenticate"){
                  addresses = ports.query('AuthenticateApp');
                  if (addresses.length)
                    authenticateNo = (authenticateNo + 1) % addresses.length;
                  i=authenticateNo;

                  req.headers["content-type"] = "application/json";

      }else if(appname=="googlemap"){
                  addresses = ports.query('GoogleMapApp');
                  if (addresses.length)
                    googleMapNo = (googleMapNo + 1) % addresses.length;
                  i=googleMapNo;

      }else if(appname=="FCM"){
                  addresses = ports.query('FCMServer');
                  if (addresses.length)
                    notifyNo = (notifyNo + 1) % addresses.length;
                  i=notifyNo;
      }else {
            if(req.method=='GET')
            {
                addresses = ports.query(appname+'QueryApp');
                if (addresses.length)
                  queryNo = (queryNo + 1) % addresses.length;
                i=queryNo;
            }
            else{
                addresses = ports.query(appname+'InsertApp');
                if (addresses.length)
                  insertNo = (insertNo + 1) % addresses.length;
                i=insertNo;
            }

            if(req.method=='PUT' || req.method=='PATCH' || req.method=='POST' )
                req.headers["content-type"] = "application/json";

      }

      if (!addresses.length) {
            return res.json({ success: false, message: 'Service unavailable' });
      }


      console.log(totalReqCount + " : " + req.method + " - " +req.url + " - Target : " + addresses[i].host + " Port : " + addresses[i].port);

      proxy.proxyRequest(req, res, {
        target     : addresses[i],
        enable  : { xforward: true }
      }, function(e) {

          console.log(e);

      });
}


var http = require('http').Server(app);
http.listen(config.ProxyPort, function(){
  console.log('listening on port:' + config.ProxyPort);
});


// Connect to Server Manager
var socket = require('socket.io-client')(config.ManagerServer+":"+config.ManagerServerPort);
socket.on('connect', function(){
    console.log("Conected to Server Manager with Id = " + socket.id);
    socket.emit('Login', { name: 'ProxyServer' });
});

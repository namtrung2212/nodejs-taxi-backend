var serverConfig= require ("./ServerConfig");
var config= require ("../GlobalConfig");
var seaport = require("seaport");
var ports = seaport.connect(config.SeaportServer, config.SeaportPort);
ports.setMaxListeners(5000);
require("mongoose").connect(config.DBAddress);

var excludeAppNames=[];

var fs = require('fs');
fs.readdir("../../Models", function(err, items) {
    for (var i=0; i<items.length; i++) {

        var file = "../../Models/" + items[i];
        if(file.match(".js$") == ".js")
        {
            var modelName = items[i].substr(0, items[i].length-3);
            if(!(modelName in excludeAppNames))
            {

                var appPath = "./Apps/"+modelName +"QueryApp";

                if( fs.existsSync(appPath+".js")){
                    app = require(appPath);
                }else{
                    appPath= "../../BaseApps/BaseQueryApp.js";
                    app=require(appPath)(modelName);
                }
                
                var port=ports.register(modelName +"QueryApp");
                app.listen(port);

                console.log(modelName + " : " + appPath + " - Port : " + port );

            }
        }

    }
});


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

var config= require ("../GlobalConfig");
var seaport = require('seaport');
var ports = seaport.connect(config.SeaportServer, config.SeaportPort);
ports.setMaxListeners(5000);
require("mongoose").connect(config.DBAddress);

var excludeAppNames=[];

var fs = require('fs');
fs.readdir("../../Models", function(err, items) {
  if(err)
  console.log(err);

    for (var i=0; i<items.length; i++) {

        var file = "../../Models/" + items[i];
        if(file.match(".js$") == ".js")
        {
            var modelName = items[i].substr(0, items[i].length-3);
            if(!(modelName in excludeAppNames))
            {
                var appPath = "./Apps/"+modelName +"CalcApp";

                  //  console.log(appPath);
                try {
                    fs.accessSync(appPath+".js", fs.F_OK);
                    console.log(appPath);
                    app = require(appPath);

                    var port=ports.register(modelName +"CalcApp");
                    app.listen(port);
                } catch (e) {

                }


            }
        }

    }
});



// Connect to Server Manager
var socket = require('socket.io-client')(config.ManagerServer+":"+config.ManagerServerPort);
socket.on('connect', function(){
    console.log("Conected to Server Manager with Id = " + socket.id);
    socket.emit('Login', { name: 'CalcServer' });
});

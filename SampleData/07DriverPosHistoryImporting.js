var config =require('../Servers/GlobalConfig');
require("mongoose").connect(config.DBAddress);

var Q = require('q');

var data =   require("./07DriverPosHistoryData.json");

var Driver     =   require("../Models/Driver");
var DriverPosHistory =   require("../Models/DriverPosHistory");



data.map(function(item) {

      setDriver(item).then(function (newItem) {

            DriverPosHistory.create(newItem,function(err)
            {
              if(err)
                  console.log(err);
              else
                  console.log("done");
            });

      });

})


function setDriver(item){

  var deferred = Q.defer();

  if(item.Driver == null && item.DriverName != null && item.DriverCitizenID != null){

        Driver.findOne({Name : item.DriverName , CitizenID : item.DriverCitizenID}, function(err,obj){

              if(obj){
                  item.Driver = obj._id;
                  deferred.resolve(item);
              }else{
                  deferred.reject(new Error(err));
              }

       });
  }

  return deferred.promise;

}

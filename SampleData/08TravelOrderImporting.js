var config =require('../Servers/GlobalConfig');
require("mongoose").connect(config.DBAddress);

var Q = require('q');

var data =   require("./08TravelOrderData.json");

var TravelOrder =   require("../Models/TravelOrder");
var User =   require("../Models/User");
var Driver =   require("../Models/Driver");

var iCount =0;
data.map(function(order) {

      iCount++;
      Q.all([getDriver(order),getUser(order),Q.resolve(order)])
      .spread(function (driver,user,order) {

            if(driver != null && user != null && order != null){

              order.Driver = driver._id;
              order.User = user._id;

              TravelOrder.create(order,function(err)
              {
                if(err)
                    console.log(err);
                else
                    console.log("done");
              });

            }else{
                  console.log("Error at Order : " + iCount + " with Driver = " + driver + " and User = " + user);
            }

      });

})


function getDriver(order){

  var deferred = Q.defer();

  if(order.Driver == null && order.DriverName != null && order.DriverCitizenID != null){

        Driver.findOne({Name : order.DriverName , CitizenID : order.DriverCitizenID}, function(err,driver){

              deferred.resolve(driver);

       });

  }else{

      deferred.resolve(null);
  }

  return deferred.promise;

}

function getUser(order){

  var deferred = Q.defer();

  if(order.User == null && order.UserName != null && order.UserPhoneNo != null){

        User.findOne({Name : order.UserName , PhoneNo : order.UserPhoneNo}, function(err,user){

              deferred.resolve(user);

       });
     }else{

         deferred.resolve(null);
     }

  return deferred.promise;

}

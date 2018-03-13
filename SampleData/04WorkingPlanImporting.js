var config =require('../Servers/GlobalConfig');
require("mongoose").connect(config.DBAddress);
var Q = require('q');

var data =   require("./04WorkingPlanData.json");
var Company =   require("../Models/Company");
var Driver =   require("../Models/Driver");
var Vehicle =   require("../Models/Vehicle");
var Team =   require("../Models/Team");
var WorkingPlan =   require("../Models/WorkingPlan");
var DriverWorkingPlanHelper =   require("../Servers/Utils/DriverWorkingPlanHelper");

var count = 0;
Q.all(data.map(function(item) {

           ImportData(item);

    })
);

function ImportData(item){
     Q.all([getDriver(item), getCompany(item), getTeam(item), getVehicle(item),initWorkingPlan(item)])
      .spread(createWorkingPlan);
}

function getDriver(item){

  var deferred = Q.defer();

  Driver.findOne({Name : item.DriverName , CitizenID : item.DriverCitizenID}, function(error,result){

          if (error) {
              deferred.reject(new Error(error));
          }
          else {

            deferred.resolve(result);
          }
   });

   return deferred.promise;

}

function getCompany(item){

    var deferred = Q.defer();

    Company.findOne({Name : item.Company}, function(error,result){

            if (error) {
                deferred.reject(new Error(error));
            }
            else {
                deferred.resolve(result);
            }
     });

     return deferred.promise;
}

function getTeam(item){

      var deferred = Q.defer();
      Company.findOne({Name : item.Company}, function(error,company){

              if (error) {
                    deferred.reject(new Error(error));
              }
              else {
                    if(!company){
                        deferred.resolve(null);
                    }else {
                        Team.findOne({Name : item.Team, Company : company._id}, function(error,team){

                                if (error) {
                                    deferred.reject(new Error(error));
                                }
                                else {
                                    deferred.resolve(team);
                                }
                         });
                    }
              }
       });

       return deferred.promise;
}

function getVehicle(item){

    var deferred = Q.defer();

    Vehicle.findOne({No : item.VehicleNo , Country : item.VehicleCountry}, function(error,vehicle){

            if (error) {
                deferred.reject(new Error(error));
            }
            else {
              deferred.resolve(vehicle);
            }
     });

     return deferred.promise;
}

function initWorkingPlan(item){

      var deferred = Q.defer();

      var working = new WorkingPlan();
      working.IsLeader =  item.IsLeader;
      working.Priority =  item.Priority;
      working.QualityService = item.QualityService;
      working.FromDateTime =  item.FromDateTime;
      working.ToDateTime =  item.ToDateTime;

      deferred.resolve(working);

      return deferred.promise;

}


var count = 0
function createWorkingPlan(driver, company,team , vehicle,working){

    if( !driver || !company || !team || !vehicle || !working)
        return null;

    working.Driver= driver._id;
    working.DriverName = driver.Name;
    working.CitizenID = driver.CitizenID;
    working.Company= company._id;
    working.CompanyName= company.Name;
    working.Team= team._id;
    working.TeamName= team.Name;
    working.Country = team.Country;
    working.Vehicle= vehicle._id;
    working.VehicleNo= vehicle.No;
    working.VehicleType= vehicle.VehicleType;
    working.VehicleProvince= vehicle.Province;
    working.VehicleBrand= vehicle.Brand;
    working.save();

    count++;
    console.log("working  " + count);

}

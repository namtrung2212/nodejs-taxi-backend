
var Q = require('q');

var Driver = require("../../Models/Driver");
var DriverStatus = require("../../Models/DriverStatus");
var DriverPosHistory = require("../../Models/DriverPosHistory");
var VehicleStatus = require("../../Models/VehicleStatus");
var WorkingPlan = require("../../Models/WorkingPlan");
var TravelOrder = require("../../Models/TravelOrder");
var Company = require("../../Models/Company");
var Team = require("../../Models/Team");
var Vehicle = require("../../Models/Vehicle");
var DriverWorkingPlanHelper = require("./DriverWorkingPlanHelper");


var exports = module.exports = {};


exports.getCompany = function(companyId){

    var deferred = Q.defer();

    Company.findOne({_id : companyId}, function(error,result){

            if (error) {
                deferred.reject(new Error(error));
            }
            else {
                deferred.resolve(result);
            }
     });

     return deferred.promise;
};

exports.getTeam = function(teamId){

      var deferred = Q.defer();

      Team.findOne({_id : teamId}, function(error,team){

              if (error) {
                  deferred.reject(new Error(error));
              }
              else {
                  deferred.resolve(team);
              }
       });


       return deferred.promise;
};

exports.getVehicle = function(vehicleId){

      var deferred = Q.defer();

      Vehicle.findOne({_id : vehicleId}, function(error,vehicle){

              if (error) {
                  deferred.reject(new Error(error));
              }
              else {
                  deferred.resolve(vehicle);
              }
       });


       return deferred.promise;
};


exports.getDriver = function(driverId){

      var deferred = Q.defer();

      Driver.findOne({_id : driverId}, function(error,result){

              if (error) {
                  deferred.reject(new Error(error));
              }
              else {
                  deferred.resolve(result);
              }
       });

       return deferred.promise;

};

exports.getDriverStatus = function(driverId){

  var deferred = Q.defer();

  DriverStatus.findOne({Driver: driverId},function(error,result){

          if (error) {
              deferred.reject(new Error(error));
          }
          else {

            deferred.resolve(result);
          }
   });

   return deferred.promise;

};

exports.getDriverStatusByOrder = function(order){

  var deferred = Q.defer();

  DriverStatus.findOne({Driver: order.Driver},function(error,result){

          if (error) {
              deferred.reject(new Error(error));
          }
          else {

            deferred.resolve(result);
          }
   });

   return deferred.promise;

};

exports.GetDriversUsingMyVehicle = function(mydriverId){

      var deferred = Q.defer();

      Q.all([DriverWorkingPlanHelper.GetDefaultWorkingPlan(mydriverId),Q.resolve(mydriverId)])
      .spread(function(workingplan,driverId){

              DriverStatus.find({Driver : { $ne: mydriverId }, Vehicle: workingplan.Vehicle, IsVehicleTaken: 1},function(err,statuses){

                      deferred.resolve(statuses);

              });

      });

      return deferred.promise;
};


exports.RegisterAndGetDefaultWorkingPlan = function(driverId,vehicleId,qualityService,isLeader){

      var deferred = Q.defer();

      Q.all([DriverWorkingPlanHelper.RegisterNewWorkingPlanForDriver(driverId,vehicleId,qualityService,isLeader),Q.resolve(driverId)])
       .spread(function(defaultPlan,driverId){

              if(defaultPlan){

                      exports.TakeVehicleFromDefaultWorkingPlan(driverId).then(function(driverStatus){
                            deferred.resolve(driverStatus);
                      });

              }else{

                    deferred.resolve(null);
              }

      });

      return deferred.promise;
};

exports.TakeVehicleFromDefaultWorkingPlan = function(driverId){

      var deferred = Q.defer();

      DriverWorkingPlanHelper.GetDefaultWorkingPlan(driverId).then(function(plan){

              if(plan){

                      DriverStatus.findOneAndUpdate( {Driver: plan.Driver, WorkingPlan: plan._id, Vehicle: null },
                                                {
                                                    Company:plan.Company,
                                                    CompanyName:plan.CompanyName,
                                                    Team:plan.Team,
                                                    TeamName:plan.TeamName,
                                                    Country:plan.Country,
                                                    Vehicle:plan.Vehicle,
                                                    VehicleNo:plan.VehicleNo,
                                                    VehicleBrand:plan.VehicleBrand,
                                                    VehicleType:plan.VehicleType,
                                                    VehicleProvince:plan.VehicleProvince,
                                                    QualityService:plan.QualityService,
                                                    IsVehicleTaken : 1
                                                }, {new: true}
                                                ,function(err2,driverStatus){

                                                        if (err2) {
                                                            deferred.resolve(null);
                                                        }else{
                                                            deferred.resolve(driverStatus);
                                                        }

                                                });

                      VehicleStatus.findOneAndUpdate( {Vehicle: plan.Vehicle},
                                                {
                                                    Driver:plan.Driver,
                                                    DriverName:plan.DriverName,
                                                    CitizenID:plan.CitizenID
                                                }, {new: true},function(err3, raw){

                                                });

              }else{
                      deferred.resolve(null);
              }


      });

      return deferred.promise;
};

exports.HandOverVehicle = function(vehicleId,fromDriverId,toDriverId){

      var deferred = Q.defer();

      VehicleStatus.findOne({Vehicle: vehicleId, Driver: fromDriverId},function(err,vehicleStatus){

              if(vehicleStatus){

                      DriverStatus.findOneAndUpdate( {Driver: fromDriverId, IsVehicleTaken: 1,Vehicle: VehicleId},
                                                {
                                                    IsVehicleTaken: 0,
                                                    Vehicle: null,
                                                    VehicleNo:null,
                                                    VehicleBrand:null,
                                                    VehicleType:null,
                                                    VehicleProvince:null,
                                                    QualityService:null

                                                }, {new: true},function(err, sourceStatus){


                                                });

                      DriverStatus.findOneAndUpdate( {Driver: toDriverId, IsVehicleTaken: 0,Vehicle:  null },
                                                {
                                                    IsVehicleTaken: 1,
                                                    Vehicle: vehicleStatus.Vehicle,
                                                    VehicleNo:vehicleStatus.VehicleNo,
                                                    VehicleBrand:vehicleStatus.VehicleBrand,
                                                    VehicleType:vehicleStatus.VehicleType,
                                                    VehicleProvince:vehicleStatus.VehicleProvince,
                                                    QualityService:vehicleStatus.QualityService

                                                },{new: true}
                                                ,function(err2, destStatus){

                                                    if(err2){

                                                          deferred.resolve(null);

                                                    }else{

                                                        deferred.resolve(destStatus);

                                                        if(destStatus){
                                                                VehicleStatus.findOneAndUpdate( {Vehicle: vehicleId, Driver: fromDriverId},
                                                                                        {
                                                                                            Driver:destStatus.Driver,
                                                                                            DriverName:destStatus.DriverName,
                                                                                            CitizenID:destStatus.CitizenID

                                                                                        }, {new: true},function(err2, destStatus){

                                                                                            if(!err2){


                                                                                            }

                                                                                        });
                                                      }
                                                    }


                                                });


              }else{
                    deferred.resolve(null);
              }
      });

      return deferred.promise;
};

exports.ChangeDriverReadyStatus = function(driverId){

      var deferred = Q.defer();

      TravelOrder.findOne().where("Driver",driverId)
                           .or([
                                { "Status": "DriverPicking"},
                                { "Status": "Pickuped"}
                           ])
      .sort({updatedAt: -1})
      .exec(function(err,order){

              if(order){

                        DriverStatus.findOneAndUpdate({Driver: driverId},{IsReady:0}, {new: true},function(err, obj){
                                deferred.resolve(obj);
                        });

              }else{
                        DriverStatus.findOne({Driver: driverId},function(err,status){

                            if(status){

                               status.IsReady = !status.IsReady;
                               status.save(function(err2,obj){
                                   deferred.resolve(obj);
                               });

                            }else{
                                  deferred.resolve(null);
                            }

                        });
              }

      });

      return deferred.promise;
};

exports.ChangeDriverStatusToReadyIfFree = function(driverId){

      var deferred = Q.defer();

      TravelOrder.findOne().where("Driver",driverId)
                           .or([
                                { "Status": "DriverPicking"},
                                { "Status": "Pickuped"}
                           ])
      .sort({updatedAt: -1})
      .exec(function(err,order){

              if(order == null){

                        DriverStatus.findOne({Driver: driverId},function(err,status){

                            if(status){

                               status.IsReady = 1;
                               status.save(function(err2,obj){
                                   deferred.resolve(obj);
                               });

                            }else{
                                  deferred.resolve(null);
                            }

                        });
              }

      });

      return deferred.promise;
};

exports.UpdateLocation = function(driverId,lat,long,degree,speed){

      var deferred = Q.defer();

      var pos = new DriverPosHistory();
      pos.Driver = driverId;
      pos.Location = [lat,long];
      pos.Degree = degree;
      pos.Speed = speed;
      pos.save(function(err2,obj){

            if(obj != null){

                DriverStatus.findOne({Driver: obj.Driver},function(err,status){

                    deferred.resolve(status);

                });

            }else{

                deferred.resolve(null);

            }

      });

      return deferred.promise;

};


var DriverStatus     =   require("../../../Models/DriverStatus");
var VehicleStatus     =   require("../../../Models/VehicleStatus");
var WorkingPlan     =   require("../../../Models/WorkingPlan");
var TravelOrderHelper = require('../../Utils/TravelOrderHelper');
var DriverHelper = require('../../Utils/DriverHelper');
var DriverWorkingPlanHelper = require('../../Utils/DriverWorkingPlanHelper');


app=require("../../../BaseApps/BaseQueryApp")("DriverStatus",
  {
      expireRecord : -1,
      expireDataset : -1,

      customQueryAPIs : function(router) {
/*
        router.route("/GetNearestDrivers").get(function(req,res){

              var token =req.headers['token'];
              var hash =req.headers['hash'];
              var pagesize = req.query.pagesize || 200;
              var maxDistance = req.query.distance || 30000;

              var coords = [];
              coords[0] = req.query.longtitude;
              coords[1] = req.query.latitude;

              var queryBuilder=DriverStatus.find({
                  Location: {
                    $near: coords,
                    $maxDistance: (maxDistance /6378137)
                  },
                  IsReady: 1,
                  IsLocked : 0,
                  IsVehicleTaken : 1,
                  Vehicle : { $ne: null }
              });

              if(req.query.vehicletype)
                  queryBuilder=queryBuilder.where("VehicleType",req.query.vehicletype);

              if(req.query.quality)
                  queryBuilder=queryBuilder.where("QualityService",req.query.quality);

              if( req.query.page )
                  queryBuilder=queryBuilder.skip( parseInt(pagesize)* (parseInt(req.query.page)-1));

              queryBuilder=queryBuilder.limit( parseInt(pagesize));

              queryBuilder.exec(function(err, driverStatus) {

                  if (err) {
                    return res.status(500).json(err);

                  }
                  res.status(200).json(driverStatus);

              });

        });
*/

        router.route("/GetNearestDriversForOrder").get(function(req,res){

              var orderId = req.query.orderId;
              var page = req.query.page;
              var pagesize = req.query.pagesize || 20;

              TravelOrderHelper.GetNearestDriversForOrder(orderId,page,pagesize).then(
                function(results) {

                    res.json(results);

              });

        });


        router.route("/GetDefaultWorkingPlan/:id").get(function(req,res){

              var driverId = req.params.id;
              DriverWorkingPlanHelper.GetDefaultWorkingPlan(driverId).then(function(workingplan){

                  res.json(workingplan);

              });

        });

        router.route("/GetDriversUsingMyVehicle/:id").get(function(req,res){

              var driverId = req.params.id;
              DriverHelper.GetDriversUsingMyVehicle(driverId).then(function(statuses){

                  res.json(statuses);

              });

        });


        router.route("/TakeDefaultVehicle/:id").get(function(req,res){

              var driverId = req.params.id;
              DriverHelper.TakeVehicleFromDefaultWorkingPlan(driverId).then(function(driverStatus){

                  res.json(driverStatus);

              });

        });

        router.route("/HandOverVehicle").get(function(req,res){

              var fromDriverId = req.query.fromDriver;
              var toDriverId = req.query.toDriver;
              var vehicleId = req.query.Vehicle;

              DriverHelper.HandOverVehicle(vehicleId,fromDriverId,toDriverId).then(function(driverStatus){

                  res.json(driverStatus);

              });


        });

        router.route("/UpdateLocation").get(function(req,res){

              var driverId = req.query.driverId;
              var lat = req.query.lat;
              var long = req.query.long;
              var degree = req.query.degree;
              var speed = req.query.speed;

              DriverHelper.UpdateLocation(driverId,lat,long,degree,speed).then(function(driverStatus){

                  res.json(driverStatus);

              });

        });


        router.route("/ChangeReadyStatus").get(function(req,res){

              DriverHelper.ChangeDriverReadyStatus(req.query.driverId).then(function(status){
                    res.json(status);
              });

        });

        router.route("/ChangeDriverStatusToReadyIfFree").get(function(req,res){

              DriverHelper.ChangeDriverStatusToReadyIfFree(req.query.driverId).then(function(status){
                    res.json(status);
              });

        });

        return router;
      }
  }
);

module.exports = app;

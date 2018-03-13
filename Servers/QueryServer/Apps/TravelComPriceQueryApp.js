var request = require('request');
var mongoose = require('mongoose');
var Q = require('q');
var TravelPriceHelper = require('../../Utils/TravelPriceHelper');
var TravelPriceAverage = require("../../../Models/TravelPriceAverage");


module.exports = require("../../../BaseApps/BaseQueryApp")("TravelComPrice",{
    expireRecord : -1,
    expireDataset : -1,

    customQueryAPIs : function(router) {

      router.route("/CalculateAverageTripPrice").get(function(req,res){


              if(!req.query["Country"]){
                res.json("Country can not null");
                return;
              }

              if(!req.query["Currency"]){
                res.json("Currency can not null");
                return;
              }

              if(!req.query["UserId"] ){
                res.json("User can not null");
                return;
              }

              if(!req.query["Distance"]){
                res.json("Distance can not null");
                return;
              }

              if(!req.query["PickupLat"]){
                res.json("PickupLat can not null");
                return;
              }

              if(!req.query["PickupLong"]){
                res.json("PickupLong can not null");
                return;
              }


              var params = {

                  PickupLoc : [req.query["PickupLat"],req.query["PickupLong"]],
                  Country :   req.query["Country"],
                  VehicleType :   req.query["VehicleType"],
                  QualityService :   req.query["QualityService"],
                  UserId : req.query["UserId"],
                  QualityService :   req.query["Distance"],
                  OrderPickupTime : new Date()

              };

              TravelPriceHelper.CalculateAverageTripPrice(params).then(function(data){

                    if(data != null)
                        res.json(data);
                    else
                        res.json(null);
              });

      });


      router.route("/TryToCalculateTripPrice").get(function(req,res){

            var orderId = req.query.orderId;
            var driverId = req.query.driverId;
            TravelPriceHelper.TryToCalculateTripPrice(orderId,driverId).then(function(data){

                      res.json(data.finalprice);
            });


      });



      return router;
    }
});


var Q = require('q');

var Driver = require("../../Models/Driver");
var DriverStatus = require("../../Models/DriverStatus");
var VehicleStatus = require("../../Models/VehicleStatus");
var WorkingPlan = require("../../Models/WorkingPlan");
var TravelOrder = require("../../Models/TravelOrder");
var Team = require("../../Models/Team");


var exports = module.exports = {};

exports.CalculateDriverStatistic = function(driverId){

    var deferred = Q.defer();

    TravelOrder.aggregate()
                .match({ $and: [
                                  {Driver: driverId} ,
                                  { $or: [
                                            { Status : "Finished"},
                                            { Status : "VoidedBfPickupByUser"},
                                            { Status : "VoidedBfPickupByDriver"},
                                            { Status : "VoidedAfPickupByUser"},
                                            { Status : "VoidedAfPickupByDriver"}
                                          ]}
                                ]
                       })
                .group({
                        _id  : "$Driver",
                        ServedQty : {$sum: 1},
                        RateCount : {$sum: {
                                          $cond:[{ $gt: ["$Rating",0]},
                                              1,
                                              0
                                           ]
                                     }},

                        VoidedBfPickupByDriver : {$sum: {
                                              $cond:[
                                                        {$or:  [
                                                                   {$eq: ["$Status","VoidedBfPickupByDriver"]}
                                                        ]},
                                                         1,
                                                         0
                                              ]
                                         }},

                        VoidedAfPickupByDriver : {$sum: {
                                              $cond:[
                                                        {$or:  [
                                                                   {$eq: ["$Status","VoidedAfPickupByDriver"]}
                                                        ]},
                                                         1,
                                                         0
                                              ]
                                         }},

                       VoidedBfPickupByUser : {$sum: {
                                             $cond:[
                                                       {$or:  [
                                                                  {$eq: ["$Status","VoidedBfPickupByUser"]}
                                                       ]},
                                                        1,
                                                        0
                                             ]
                                        }},

                        VoidedAfPickupByUser : {$sum: {
                                              $cond:[
                                                        {$or:  [
                                                                   {$eq: ["$Status","VoidedAfPickupByUser"]}
                                                        ]},
                                                         1,
                                                         0
                                              ]
                                         }},

                          RatingSum: {$sum: "$Rating"}
                      })
                .exec(function (err, data) {

                    if(data != null && data.length > 0){

                        data.forEach(function(obj){

                              DriverStatus.findOneAndUpdate( {Driver: obj._id},
                                                        {
                                                            ServedQty:obj.ServedQty,
                                                            RateCount:obj.RateCount,
                                                            Rating:Math.ceil(obj.RatingSum/obj.RateCount),
                                                            VoidedBfPickupByDriver:obj.VoidedBfPickupByDriver,
                                                            VoidedBfPickupByUser:obj.VoidedBfPickupByUser,
                                                            VoidedAfPickupByDriver:obj.VoidedAfPickupByDriver,
                                                            VoidedAfPickupByUser:obj.VoidedAfPickupByUser
                                                        }, {new: true},function(err,raw){

                                                                      deferred.resolve(raw);

                                                        });
                        })

                    }else{

                        deferred.resolve(null);

                    }

                });


   return deferred.promise;
};

exports.CalculateStatisticForAllDrivers = function(){

          console.log("refresh Drivers Statistic");

          TravelOrder.aggregate()
                      .match({ $or: [
                                        { Status : "Finished"},
                                        { Status : "VoidedBfPickupByUser"},
                                        { Status : "VoidedBfPickupByDriver"},
                                        { Status : "VoidedAfPickupByUser"},
                                        { Status : "VoidedAfPickupByDriver"}
                                      ]})
                      .group({
                              _id  : "$Driver",
                              ServedQty : {$sum: 1},
                              RateCount : {$sum: {
                                                $cond:[{ $gt: ["$Rating",0]},
                                                    1,
                                                    0
                                                 ]
                                           }},

                              VoidedBfPickupByDriver : {$sum: {
                                                    $cond:[
                                                              {$or:  [
                                                                         {$eq: ["$Status","VoidedBfPickupByDriver"]}
                                                              ]},
                                                               1,
                                                               0
                                                    ]
                                               }},

                              VoidedAfPickupByDriver : {$sum: {
                                                    $cond:[
                                                              {$or:  [
                                                                         {$eq: ["$Status","VoidedAfPickupByDriver"]}
                                                              ]},
                                                               1,
                                                               0
                                                    ]
                                               }},

                             VoidedBfPickupByUser : {$sum: {
                                                   $cond:[
                                                             {$or:  [
                                                                        {$eq: ["$Status","VoidedBfPickupByUser"]}
                                                             ]},
                                                              1,
                                                              0
                                                   ]
                                              }},

                              VoidedAfPickupByUser : {$sum: {
                                                    $cond:[
                                                              {$or:  [
                                                                         {$eq: ["$Status","VoidedAfPickupByUser"]}
                                                              ]},
                                                               1,
                                                               0
                                                    ]
                                               }},

                                RatingSum: {$sum: "$Rating"}
                            })
                      .exec(function (err, data) {

                          data.forEach(function(obj){

                                DriverStatus.findOneAndUpdate( {Driver: obj._id},
                                                          {
                                                              ServedQty:obj.ServedQty,
                                                              RateCount:obj.RateCount,
                                                              Rating:Math.ceil(obj.RatingSum/obj.RateCount),
                                                              VoidedBfPickupByDriver:obj.VoidedBfPickupByDriver,
                                                              VoidedBfPickupByUser:obj.VoidedBfPickupByUser,
                                                              VoidedAfPickupByDriver:obj.VoidedAfPickupByDriver,
                                                              VoidedAfPickupByUser:obj.VoidedAfPickupByUser
                                                          }, {new: true},function(err,raw){

                                                          });
                          })
                      });
};

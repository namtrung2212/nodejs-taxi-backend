
var express = require('express');
var app         =   express();
var bodyParser  =   require("body-parser");
var router      =   express.Router();
var redis = require('redis');
var config =require('../../GlobalConfig');
var client = redis.createClient(config.RedisPort,config.RedisServer);

var Q = require('q');
var Notification = require("../../../Models/Notification");
var NotificationViewed = require("../../../Models/NotificationViewed");
var DriverStatus = require("../../../Models/DriverStatus");

app=require("../../../BaseApps/BaseQueryApp")("Notification",
  {
      expireRecord : -1,
      expireDataset: 1,

      customQueryAPIs : function(router) {

                        router.route("/GetNotificationByUser/:id")
                          .get(function(req,res){

                                      var response = {};

                                      var queryBuilder=Notification.find({ User : req.params.id,
                                                                        ExpireTime : { $or : [ null,{ $gt : new Date()}]}})
                                                                    .sort({createdAt: -1});

                                      queryBuilder.exec(function(err,data){
                                                if(err) {
                                                    response = {"error" : true,"message" : err};
                                                } else {
                                                    response = data;
                                                }

                                            res.json(response);
                                      });


                        });

                        router.route("/GetNotYetViewedNotificationByUser/:id")
                            .get(function(req,res){

                                        var response = {};

                                        var queryBuilder=Notification.find({ User : req.params.id,
                                                                            IsViewed : 0,
                                                                          ExpireTime : { $or : [ null,{ $gt : new Date()}]}})
                                                                      .sort({createdAt: -1});

                                        queryBuilder.exec(function(err,data){
                                                  if(err) {
                                                      response = {"error" : true,"message" : err};
                                                  } else {
                                                      response = data;
                                                  }

                                              res.json(response);
                                        });


                          });

                        router.route("/CountNotYetViewedNotificationByUser/:id")
                          .get(function(req,res){

                                      var response = {};

                                      var queryBuilder=Notification.find({ User : req.params.id,
                                                                          IsViewed : 0,
                                                                        ExpireTime : { $or : [ null,{ $gt : new Date()}]}})
                                                                    .sort({createdAt: -1}).count();

                                      queryBuilder.exec(function(err,data){
                                                if(err) {
                                                    response = {"error" : true,"message" : err};
                                                } else {
                                                    response = data;
                                                }

                                            res.json(response);
                                      });


                        });

                        router.route("/GetNotificationByDriver/:id")
                          .get(function(req,res){

                                getDriverStatus(req.params.id).then(function(driverStatus){

                                        var response = {};

                                        var coords = [];
                                        coords[0] = req.query.latitude;
                                        coords[1] = req.query.longtitude;

                                        var queryBuilder=Notification.find({ ExpireTime : { $or : [ null,{ $gt : new Date()}]}})
                                                                     .or([{ToCompanyDriver : driverStatus.Company},
                                                                          {ToTeamDriver : driverStatus.Team},
                                                                          {ToVehicleType : driverStatus.VehicleType},
                                                                          {ToQualityService : driverStatus.QualityService},
                                                                          {ToDriver : driverStatus.Driver},
                                                                          {ToLocationDriver: { $and: [{$exists : true},
                                                                                                       {
                                                                                                         $near: coords,
                                                                                                         $maxDistance: "$LocationRadian"
                                                                                                       }]
                                                                                            }}
                                                                          ])

                                                                     .sort({createdAt: -1});

                                        queryBuilder.exec(function(err,data){
                                                  if(err) {
                                                      response = {"error" : true,"message" : err};
                                                  } else {
                                                      response = data;
                                                  }

                                              res.json(response);
                                        });

                                });


                        });

                        router.route("/GetNotYetViewedNotificationByDriver/:id")
                          .get(function(req,res){

                                getDriverStatus(req.params.id).then(function(driverStatus){

                                        var response = {};

                                        var coords = [];
                                        coords[0] = req.query.latitude;
                                        coords[1] = req.query.longtitude;

                                        var queryBuilder=Notification.find({ IsViewed : 0,ExpireTime : { $or : [ null,{ $gt : new Date()}]}})
                                                                     .or([{ToCompanyDriver : driverStatus.Company},
                                                                          {ToTeamDriver : driverStatus.Team},
                                                                          {ToVehicleType : driverStatus.VehicleType},
                                                                          {ToQualityService : driverStatus.QualityService},
                                                                          {ToDriver : driverStatus.Driver},
                                                                          {ToLocationDriver: { $and: [{$exists : true},
                                                                                                       {
                                                                                                         $near: coords,
                                                                                                         $maxDistance: "$LocationRadian"
                                                                                                       }]
                                                                                            }}
                                                                          ])

                                                                     .sort({createdAt: -1});

                                        queryBuilder.exec(function(err,data){
                                                  if(err) {
                                                      response = {"error" : true,"message" : err};
                                                  } else {
                                                      response = data;
                                                  }

                                              res.json(response);
                                        });

                                });


                        });

                        router.route("/CountNotYetViewedNotificationByDriver/:id")
                          .get(function(req,res){
                            getDriverStatus(req.params.id).then(function(driverStatus){

                                    var response = {};

                                    var coords = [];
                                    coords[0] = req.query.latitude;
                                    coords[1] = req.query.longtitude;

                                    var queryBuilder=Notification.find({ IsViewed : 0,ExpireTime : { $or : [ null,{ $gt : new Date()}]}})
                                                                 .or([{ToCompanyDriver : driverStatus.Company},
                                                                      {ToTeamDriver : driverStatus.Team},
                                                                      {ToVehicleType : driverStatus.VehicleType},
                                                                      {ToQualityService : driverStatus.QualityService},
                                                                      {ToDriver : driverStatus.Driver},
                                                                      {ToLocationDriver: { $and: [{$exists : true},
                                                                                                   {
                                                                                                     $near: coords,
                                                                                                     $maxDistance: "$LocationRadian"
                                                                                                   }]
                                                                                        }}
                                                                      ])

                                                                 .sort({createdAt: -1}).count();

                                    queryBuilder.exec(function(err,data){
                                              if(err) {
                                                  response = {"error" : true,"message" : err};
                                              } else {
                                                  response = data;
                                              }

                                          res.json(response);
                                    });

                            });


                        });

                        function getDriverStatus(driverId){

                            var deferred = Q.defer();

                            DriverStatus.findOne({Driver : driverId}, function(error,result){

                                    if (error) {
                                        deferred.reject(new Error(error));
                                    }
                                    else {
                                        deferred.resolve(result);
                                    }
                             });

                             return deferred.promise;

                          }


        return router;
      }
  }
);

module.exports = app;

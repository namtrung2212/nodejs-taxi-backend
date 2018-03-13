
var express = require('express');
var app         =   express();
var bodyParser  =   require("body-parser");
var router      =   express.Router();
var redis = require('redis');
var config =require('../../GlobalConfig');
var client = redis.createClient(config.RedisPort,config.RedisServer);

var DriverBidding = require("../../../Models/DriverBidding");
var OrderHelper = require('../../Utils/TravelOrderHelper');

app=require("../../../BaseApps/BaseQueryApp")("DriverBidding",
  {
      expireRecord : -1,
      expireDataset: -1,

      customQueryAPIs : function(router) {

                          router.route("/GetOpenBiddingsByOrder/:id")
                            .get(function(req,res){

                                        OrderHelper.GetOpenBiddingsByOrder(req.params.id).then(function(biddings){
                                                res.json(biddings);
                                        });

                            });


                          router.route("/GetBiddingsByDriver/:id")
                            .get(function(req,res){

                                        OrderHelper.GetBiddingsByDriver(req.params.id).then(function(biddings){
                                                res.json(biddings);
                                        });

                            });


                          router.route("/GetBiddingsByOrderAndDriver")
                            .get(function(req,res){

                                        var response = {};

                                        var queryBuilder=DriverBidding.find()
                                        .where("Driver",req.query.Driver)
                                        .where("TravelOrder",req.query.TravelOrder)
                                        .where('ExpireTime').gt(Date()).sort({updatedAt: -1});

                                        queryBuilder.exec(function(err,data){
                                                  if(err) {
                                                      response = {"error" : true,"message" : err};
                                                  } else {
                                                      response = data;
                                                  }

                                              res.json(response);
                                        });


                            });



        return router;
      }
  }
);

module.exports = app;

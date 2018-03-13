
var express = require('express');
var app         =   express();
var bodyParser  =   require("body-parser");
var router      =   express.Router();
var OrderHelper = require('../../Utils/TravelOrderHelper');
var Q = require('q');
var distance = require('gps-distance');
var map = require('google_directions');
var redis = require('redis');
var config =require('../../GlobalConfig');
var client = redis.createClient(config.RedisPort,config.RedisServer);

var TravelOrder = require("../../../Models/TravelOrder");
var DriverStatus =   require("../../../Models/DriverStatus");

app=require("../../../BaseApps/BaseQueryApp")("TravelOrder",
  {
      expireRecord : -1,
      expireDataset: -1,

      customQueryAPIs : function(router) {


                          router.route("/UserSendRequestToDriver").get(function(req,res){

                                    var orderId = req.query.orderId || null;
                                    var driverId = req.query.driverId || null;

                                    OrderHelper.UserSendRequestToDriver(orderId,driverId).then(function(order){
                                            res.json(order);
                                    });

                          });

                          router.route("/UserCancelRequestingToDriver").get(function(req,res){

                                    var orderId = req.query.orderId || null;

                                    OrderHelper.UserCancelRequestingToDriver(orderId).then(function(order){
                                            res.json(order);
                                    });

                          });

                          router.route("/DriverAcceptRequest").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      var driverId = req.query.driverId || null;

                                      OrderHelper.DriverAcceptRequest(orderId,driverId).then(function(order){
                                              res.json(order);
                                      });

                          });

                          router.route("/DriverRejectRequest").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      var driverId = req.query.driverId || null;

                                      OrderHelper.DriverRejectRequest(orderId,driverId).then(function(order){
                                              res.json(order);
                                      });

                          });

                          router.route("/DriverStartPicking").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      var driverId = req.query.driverId || null;

                                      OrderHelper.DriverStartPicking(orderId,driverId).then(function(order){
                                              res.json(order);
                                      });

                          });

                          router.route("/DriverAtPickupPlace").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      NotificationHelper.DriverAtPickupPlace(orderId);
                                      res.json("done");

                          });

                          router.route("/UserGotThePickupNotice").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      NotificationHelper.UserGotThePickupNotice(orderId);
                                      res.json("done");

                          });

                          router.route("/DriverStartTrip").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      var driverId = req.query.driverId || null;
                                      var voidLat = req.query["voidLat"];
                                      var voidLong = req.query["voidLong"];

                                      OrderHelper.DriverStartTrip(orderId,driverId,voidLat,voidLong).then(function(order){
                                              res.json(order);
                                      });

                          });

                          router.route("/UserVoidOrder").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      var voidLat = req.query["voidLat"];
                                      var voidLong = req.query["voidLong"];

                                      OrderHelper.UserVoidOrder(orderId,voidLat,voidLong).then(function(order){
                                              res.json(order);
                                      });

                          });

                          router.route("/DriverVoidOrder").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      var voidLat = req.query["voidLat"];
                                      var voidLong = req.query["voidLong"];

                                      OrderHelper.DriverVoidOrder(orderId,voidLat,voidLong).then(function(order){
                                              res.json(order);
                                      });

                          });

                          router.route("/DriverFinishTrip").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      var driverId = req.query.driverId || null;
                                      var voidLat = req.query["voidLat"];
                                      var voidLong = req.query["voidLong"];

                                      OrderHelper.DriverFinishTrip(orderId,driverId,voidLat,voidLong).then(function(order){
                                              res.json(order);
                                      });

                          });

                          router.route("/DriverReceivedCash").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      var driverId = req.query.driverId || null;

                                      OrderHelper.DriverReceivedCash(orderId,driverId).then(function(order){
                                              res.json(order);
                                      });

                          });

                          router.route("/UserPayByPersonalCard").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      var cardId = req.query.cardId || null;
                                      var cardCurry = req.query.cardCurry || null;

                                      OrderHelper.UserPayByPersonalCard(orderId,cardId,cardCurry).then(function(order){
                                              res.json(order);
                                      });

                          });

                          router.route("/UserPayByBusinessCard").get(function(req,res){

                                      var orderId = req.query.orderId || null;
                                      var cardId = req.query.cardId || null;
                                      var cardCurry = req.query.cardCurry || null;

                                      OrderHelper.UserPayByBusinessCard(orderId,cardId,cardCurry).then(function(order){
                                              res.json(order);
                                      });

                          });



                          router.route("/SetDriverRequestingOrderToOpen").get(function(req,res){

                                      var orderId = req.query.orderId || null;

                                      OrderHelper.SetDriverRequestingOrderToOpen(orderId).then(function(order){
                                              res.json(order);
                                      });

                          });


                          router.route("/GetNearestLateOrders").get(function(req,res){

                                var maxDistance = req.query.distance || 50;

                                var coords = [];
                                coords[0] = req.query.latitude;
                                coords[1] = req.query.longtitude;

                                var vehicleType = req.query.vehicleType || null;
                                var qualityService = req.query.qualityService || null;

                                OrderHelper.GetNearestLateOrders(coords,maxDistance,vehicleType,qualityService).then(function(data){

                                        res.status(200).json(data);

                                });

                          });


                          router.route("/HostCreateTripMate").get(function(req,res){

                                var orderId = req.query.orderId;

                                OrderHelper.HostCreateTripMate(orderId).then(function(data){

                                        res.status(200).json(data);

                                });

                          });

                          router.route("/GetNearestMateHostOrders").get(function(req,res){

                              OrderHelper.GetNearestMateHostOrders(req.query.orderId).then(function(data){

                                      res.json(data);

                              });

                          });




                          router.route("/UserPreviewMateHostOrder").get(function(req,res){

                                var orderId = req.query.orderId;
                                var hostId = req.query.hostId;

                                OrderHelper.UserPreviewMateHostOrder(orderId,hostId).then(function(data){

                                        res.status(200).json(data);

                                });

                          });


                          router.route("/GetMateSubOrdersByHostId").get(function(req,res){

                                var hostId = req.query.hostId;

                                OrderHelper.GetMateSubOrdersByHostId(hostId).then(function(data){

                                        res.status(200).json(data);

                                });

                          });


                          router.route("/MemberRequestToJoinTripMate").get(function(req,res){

                                  var orderId = req.query.orderId;
                                  var hostId = req.query.hostId;

                                  OrderHelper.MemberRequestToJoinTripMate(orderId,hostId).then(function(order){
                                          res.json(order);
                                  });
                          });


                          router.route("/HostAcceptMateMember/:id").get(function(req,res){

                                  OrderHelper.HostAcceptMateMember(req.params.id).then(function(order){
                                          res.json(order);
                                  });
                          });

                          router.route("/HostRejectMateMember/:id").get(function(req,res){

                                  OrderHelper.HostRejectMateMember(req.params.id).then(function(order){
                                          res.json(order);
                                  });
                          });

                          router.route("/MemberLeaveFromTripMate/:id").get(function(req,res){

                                  OrderHelper.MemberLeaveFromTripMate(req.params.id).then(function(order){
                                          res.json(order);
                                  });
                          });



                          router.route("/HostCloseTripMate/:id").get(function(req,res){

                                  OrderHelper.HostCloseTripMate(req.params.id).then(function(host){
                                          res.json(host);
                                  });
                          });


                          router.route("/HostVoidTripMate/:id").get(function(req,res){

                                  OrderHelper.HostVoidTripMate(req.params.id).then(function(host){
                                          res.json(host);
                                  });
                          });




                          router.route("/UserAcceptBidding/:id").get(function(req,res){

                                  OrderHelper.UserAcceptBidding(req.params.id).then(function(order){
                                          res.json(order);
                                  });
                          });

                          router.route("/UserCancelAcceptingBidding/:id").get(function(req,res){

                                  OrderHelper.UserCancelAcceptingBidding(req.params.id).then(function(order){
                                          res.json(order);
                                  });

                          });


                          router.route("/GetLastOpenningOrderByUser/:id").get(function(req,res){

                                      OrderHelper.GetLastOpenningOrderByUser(req.params.id).then(function(data){

                                              res.status(200).json(data);

                                      });
                            });

                          router.route("/GetNotYetPaidOrderByUser/:id")
                            .get(function(req,res){

                                      OrderHelper.GetNotYetPaidOrderByUser(req.params.id).then(function(data){

                                              res.status(200).json(data);

                                      });
                          });

                          router.route("/CountNotYetPaidOrderByUser/:id")
                            .get(function(req,res){

                                      OrderHelper.CountNotYetPaidOrderByUser(req.params.id).then(function(data){

                                              res.status(200).json(data);

                                      });
                          });

                          router.route("/GetNotYetPickupOrderByUser/:id")
                            .get(function(req,res){

                                      OrderHelper.GetNotYetPickupOrderByUser(req.params.id).then(function(data){

                                              res.status(200).json(data);

                                      });
                          });

                          router.route("/CountNotYetPickupOrderByUser/:id")
                            .get(function(req,res){

                                      OrderHelper.CountNotYetPickupOrderByUser(req.params.id).then(function(data){

                                              res.status(200).json(data);

                                      });
                          });

                          router.route("/GetOnTheWayOrderByUser/:id")
                            .get(function(req,res){

                                        OrderHelper.GetOnTheWayOrderByUser(req.params.id).then(function(data){

                                                res.status(200).json(data);

                                        });
                          });

                          router.route("/CountOnTheWayOrderByUser/:id")
                              .get(function(req,res){

                                        OrderHelper.CountOnTheWayOrderByUser(req.params.id).then(function(data){

                                                res.status(200).json(data);

                                        });
                            });

                          router.route("/GetLastOpenningOrderByDriver/:id")
                            .get(function(req,res){

                                        OrderHelper.GetLastOpenningOrderByDriver(req.params.id).then(function(data){

                                                res.status(200).json(data);

                                        });

                            });

                          router.route("/GetNotYetPaidOrderByDriver/:id")
                            .get(function(req,res){

                                        OrderHelper.GetNotYetPaidOrderByDriver(req.params.id).then(function(data){

                                                res.status(200).json(data);

                                        });

                            });

                          router.route("/CountNotYetPaidOrderByDriver/:id")
                              .get(function(req,res){

                                        OrderHelper.CountNotYetPaidOrderByDriver(req.params.id).then(function(data){

                                                res.status(200).json(data);

                                        });

                            });

                          router.route("/GetNotYetPickupOrderByDriver/:id")
                            .get(function(req,res){

                                        OrderHelper.GetNotYetPickupOrderByDriver(req.params.id).then(function(data){

                                                res.status(200).json(data);

                                        });

                          });

                          router.route("/CountNotYetPickupOrderByDriver/:id")
                            .get(function(req,res){

                                        OrderHelper.CountNotYetPickupOrderByDriver(req.params.id).then(function(data){

                                                res.status(200).json(data);

                                        });

                          });

                          router.route("/GetOnTheWayOrderByDriver/:id")
                            .get(function(req,res){

                                        OrderHelper.GetOnTheWayOrderByDriver(req.params.id).then(function(data){

                                                res.status(200).json(data);

                                        });
                          });

                          router.route("/CountOnTheWayOrderByDriver/:id")
                              .get(function(req,res){

                                        OrderHelper.CountOnTheWayOrderByDriver(req.params.id).then(function(data){

                                                res.status(200).json(data);

                                        });
                            });

                          router.route("/GetStoppedOrderByDriver/:id")
                            .get(function(req,res){

                                        OrderHelper.GetStoppedOrderByDriver(req.params.id).then(function(data){

                                                res.status(200).json(data);

                                        });

                          });


                          router.route("/RecalculateTripOrder").get(function(req,res){

                                  OrderHelper.RecalculateTripOrder(req.query.orderId).then(function(data){

                                          res.status(200).json(data);

                                  });
                          });

                              router.route("/comment/:id")
                                .get(function(req,res){

                                    client.get("drivercomment"+req.params, function(err, reply) {
                                        if(reply){
                                            res.json(JSON.parse(reply));
                                        }else {

                                            var response = {};

                                            var queryBuilder=TravelOrder.find().where("Driver",req.params.id).where("Comment").ne(null).sort({updatedAt: -1});


                                            var pagesize = req.query.pagesize || 100;
                                            if( req.query.page )
                                                queryBuilder=queryBuilder.skip( parseInt(pagesize)* (parseInt(req.query.page)-1));
                                            queryBuilder=queryBuilder.limit( parseInt(pagesize));

                                            queryBuilder=queryBuilder.select('_id createdAt Comment User UserName Rating');


                                            queryBuilder.exec(function(err,data){
                                                      if(err) {
                                                          response = {"error" : true,"message" : err};
                                                      } else {
                                                          response = data;
                                                      }


                                                      var key="drivercomment"+req.params.id;
                                                      client.set(key, JSON.stringify(response));
                                                      client.expire(key, config.DefaultExpireDataset);

                                                  res.json(response);
                                            });

                                        }
                                    });

                                });



        return router;
      }
  }
);

module.exports = app;

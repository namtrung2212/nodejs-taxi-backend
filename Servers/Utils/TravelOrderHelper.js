
var Q = require('q');

var GoogleHelper = require('./GoogleHelper');
var DriverHelper = require('./DriverHelper');
var NotificationHelper = require('./NotificationHelper');
var TravelPriceHelper = require('./TravelPriceHelper');
var MongoDBHelper = require("../../BaseApps/MongoDBHelper");
var TravelOrder = require("../../Models/TravelOrder");
var DriverStatus = require("../../Models/DriverStatus");
var DriverBidding = require("../../Models/DriverBidding");
var distance = require('gps-distance');

var MIN_HOST_INCREASE_BENIFIT_PERCENT = 0.1;
var MIN_MATEMEMBER_BENIFIT_PERCENT = 0.1;
var HOST_DISCOUNT_PERCENT = 0.0;
var AVG_VELOCITY_KM_PER_HOUR = 40;
var MAX_MATE_VALID_MINUTES = 60*12;

var LAST_FINISHED_TRIPS = 5; // lấy 5 chuyến cuối nếu 3 chuyến hợp lệ thì được tạo ĐI CHUNG
var LAST_ACCEPTED_FINISHED_TRIPS = 0; // 3

var hostIdToLog = "582ff9d1a3f618f2313e847f";

function isTripMateRequestingMember(order){

  return (order.IsMateHost == 0 && order.MateHostOrder != null && order.MateStatus == "Requested"  );

}

function isTripMateMember(order){

  return (order.IsMateHost == 0 && order.MateHostOrder != null && (order.MateStatus == "Accepted" || order.MateStatus == "Closed"));

}

function isTripStopped(order){

  return ( order.Status == "VoidedAfPickupByUser" || order.Status == "VoidedAfPickupByDriver" || order.Status == "Finished");

}
function isTripOnTheWay(order){

  return ( order.Status == "Pickuped" );

}
function isTripNotYetStarted(order){

  return !( isTripOnTheWay(order) || isTripStopped(order) ) ;

}
function isHasDriver(order){

  return order.Driver != null && ( order.Status == "DriverAccepted" || order.Status == "DriverPicking" ||isTripOnTheWay(order) || isTripStopped(order));

}


var exports = module.exports = {};

exports.UserCreateOrder = function(req){

  var deferred = Q.defer();

  MongoDBHelper.createObject("TravelOrder",req, null).then(function(obj){

        if(obj != null && ( typeof obj.error === "undefined")){

              exports.RecalculateTripOrder(obj._id).then(function(obj){

                  deferred.resolve(obj);

              });
        }else{

            deferred.resolve(null);
        }


  });

   return deferred.promise;

};

exports.updateTravelOrderFromReq = function(req){

  var deferred = Q.defer();

  MongoDBHelper.updateObject("TravelOrder",req, null).then(function(obj){

        if(obj != null && ( typeof obj.error === "undefined")){

              exports.RecalculateTripOrder(obj._id).then(function(obj){

                  deferred.resolve(obj);

              });
        }else{

            deferred.resolve(null);
        }


  });

   return deferred.promise;

};

exports.updateTravelOrder = function(order){

  var deferred = Q.defer();

  order.save(function(err,newOrder){

            if(err){
                  deferred.resolve(newOrder);

            }else{

                  exports.RecalculateTripOrder(newOrder._id).then(function(obj){
                        deferred.resolve(obj);
                  });
            }


  });

   return deferred.promise;

};

exports.getTravelOrder = function(orderId){

  var deferred = Q.defer();

  TravelOrder.findOne({_id : orderId}, function(error,result){

          if (error) {
              deferred.reject(null);
          }
          else {

            deferred.resolve(result);
          }
   });

   return deferred.promise;

};

//------------------------ Driver Requesting Procedure ------------------------

exports.UserSendRequestToDriver = function(orderId,driverId){

  var deferred = Q.defer();

  TravelOrder.findOneAndUpdate({
                    _id: orderId,
                    Status : { $in : ["Open","DriverRejected"]}
         },{
           Status:"Requested",
           Driver:driverId
         }, {new: true}).exec().then(function(order){

             if(order != null){

                   exports.RecalculateTripOrder(order._id).then(function(newOrder){

                          NotificationHelper.UserRequestTaxi(newOrder._id);
                          deferred.resolve(newOrder);
                   });

             }else{
                 deferred.resolve(null);
             }

  });

   return deferred.promise;

};

exports.UserCancelRequestingToDriver = function(orderId){

    var deferred = Q.defer();


    TravelOrder.findOne({
                      _id: orderId,
                      Status : "Requested"
                }).exec(function(error,order){

                      if(order != null){

                              NotificationHelper.UserCancelRequest(order);

                              TravelOrder.findOneAndUpdate({
                                                _id: order._id,
                                                Status : "Requested"
                                     },{
                                       Status:"Open",
                                       Driver:null
                                     }).exec().then(function(order){

                                         if(order != null){

                                              exports.RecalculateTripOrder(order._id).then(function(newOrder){
                                                      deferred.resolve(newOrder);
                                              });

                                         }else{
                                             deferred.resolve(null);
                                         }

                              });
                      }
     });



     return deferred.promise;

};

exports.DriverAcceptRequest = function(orderId,driverId){

  var deferred = Q.defer();

  TravelOrder.findOneAndUpdate({
                    _id: orderId,
                    Driver:driverId,
                    Status : { $in : ["Requested","BiddingAccepted"]}
         },{
           Status:"DriverAccepted",
         }, {new: true}).exec().then(function(order){

             if(order != null){

                    exports.RecalculateTripOrder(order._id).then(function(newOrder){

                           NotificationHelper.DriverAccepted(newOrder._id);

                           if(newOrder.IsMateHost == 1){

                               exports.GetMateSubOrdersByHostId(newOrder._id).then(function(orders){

                                     for (var i = 0; i < orders.length; i++)
                                         NotificationHelper.UserShouldInvalidateOrder(orders[i].User,orders[i]._id);

                               });

                           }

                           deferred.resolve(newOrder);
                    });

             }else{
                 deferred.resolve(null);
             }

  });

   return deferred.promise;

};

exports.DriverRejectRequest = function(orderId,driverId){

  console.log("DriverRejectRequest");
  var deferred = Q.defer();

  TravelOrder.findOneAndUpdate({
                    _id: orderId,
                    Driver:driverId,
                    Status : { $in : ["Requested","BiddingAccepted"]}
         },{
           Status:"DriverRejected",
           Driver: null
         }, {new: true}).exec().then(function(order){

             if(order != null){

                    exports.RecalculateTripOrder(order._id).then(function(newOrder){

                           NotificationHelper.DriverRejected(newOrder._id);
                           deferred.resolve(newOrder);
                    });

             }else{
                 deferred.resolve(null);
             }

  });

   return deferred.promise;

};

exports.SetDriverRequestingOrderToOpen = function(orderId){

  var deferred = Q.defer();

  TravelOrder.findOneAndUpdate({
                    _id: orderId,
                    Status : { $in : ["Requested","DriverRejected"]}
         },{
           Status:"Open",
           Driver: null
         }, {new: true}).exec().then(function(order){

             if(order != null){

                    exports.RecalculateTripOrder(order._id).then(function(newOrder){

                           deferred.resolve(newOrder);
                    });

             }else{
                 deferred.resolve(null);
             }

  });

   return deferred.promise;

};

exports.DriverStartPicking = function(orderId,driverId){

  var deferred = Q.defer();

  TravelOrder.findOneAndUpdate({
                    _id: orderId,
                    Driver:driverId,
                    Status : "DriverAccepted"
         },{
           Status:"DriverPicking"
         }, {new: true}).exec().then(function(order){

             if(order != null){

                    NotificationHelper.DriverStartPicking(order._id);
                    exports.RecalculateTripOrder(order._id).then(function(newOrder){

                          if(newOrder.IsMateHost == 1){

                              exports.GetMateSubOrdersByHostId(newOrder._id).then(function(orders){

                                    for (var i = 0; i < orders.length; i++)
                                        NotificationHelper.UserShouldInvalidateOrder(orders[i].User,orders[i]._id);

                              });

                          }
                           deferred.resolve(newOrder);
                    });

             }else{
                 deferred.resolve(null);
             }

  });

   return deferred.promise;

};

exports.DriverStartTrip = function(orderId,driverId,voidLat,voidLong){

  var deferred = Q.defer();

  Q.all([exports.getTravelOrder(orderId),GoogleHelper.getFullAddress(voidLat,voidLong),Q.resolve(driverId)]).spread(function(order,address,driverId){

        if(address.length > 0){
          order.ActPickupPlace = address[0].formattedAddress;
          order.ActPickupCountry = address[0].countryCode;
        }
        order.ActPickupLoc = [voidLat,voidLong];
        order.ActPickupTime = new Date();
        order.Status = "Pickuped";

        exports.updateTravelOrder(order).then(function(newOrder){

                  NotificationHelper.DriverStartedTrip(newOrder._id);
                  deferred.resolve( newOrder);

                  if(newOrder.IsMateHost == 1){

                      exports.GetMateSubOrdersByHostId(newOrder._id).then(function(orders){

                            for (var i = 0; i < orders.length; i++)
                                NotificationHelper.UserShouldInvalidateOrder(orders[i].User,orders[i]._id);

                      });

                  }

        });


  });

  return deferred.promise;

};

exports.UserVoidOrder = function(orderId,voidLat,voidLong){

      var deferred = Q.defer();

      Q.all([exports.getTravelOrder(orderId),Q.resolve(voidLat),Q.resolve(voidLong)])
      .spread(function(order,voidLat,voidLong){

              if(order.IsMateHost == 0){

                    if(order.MateHostOrder != null){

                          MemberVoidTripMate(order,voidLat,voidLong).then(function(member){
                                deferred.resolve(member);
                          });

                    }else {

                          UserVoidNormalTrip(order,voidLat,voidLong).then(function(order){
                                deferred.resolve(order);
                          });

                    }

              }else{

                    HostVoidTripMate(order,voidLat,voidLong).then(function(host){
                          deferred.resolve(host);
                    });
              }
      });

      return deferred.promise;

};

exports.DriverVoidOrder = function(orderId,voidLat,voidLong){

      var deferred = Q.defer();

      Q.all([exports.getTravelOrder(orderId),Q.resolve(voidLat),Q.resolve(voidLong)]).spread(function(order,voidLat,voidLong){

              if(order.IsMateHost == 0){

                    DriverVoidNormalTrip(order,voidLat,voidLong).then(function(order){
                          deferred.resolve(order);
                    });

              }else{

                    DriverVoidTripMate(order,voidLat,voidLong).then(function(host){
                          deferred.resolve(host);
                    });
              }
      });

      return deferred.promise;

};

exports.DriverFinishTrip = function(orderId,driverId,voidLat,voidLong){

  var deferred = Q.defer();

  Q.all([exports.getTravelOrder(orderId),GoogleHelper.getFullAddress(voidLat,voidLong),Q.resolve(driverId)]).spread(function(order,address,driverId){

        if(address.length > 0)
          order.ActDropPlace = address[0].formattedAddress;

        order.ActDropLoc = [voidLat,voidLong];
        order.ActDropTime = new Date();
        order.Status = "Finished";

        exports.updateTravelOrder(order).then(function(newOrder){

                 NotificationHelper.DriverFinished(newOrder._id);
                 deferred.resolve( newOrder);

                 if(newOrder.IsMateHost == 1){

                     exports.GetMateSubOrdersByHostId(newOrder._id).then(function(orders){

                           for (var i = 0; i < orders.length; i++)
                               NotificationHelper.UserShouldInvalidateOrder(orders[i].User,orders[i]._id);

                     });

                 }
        });


    });

   return deferred.promise;

};

exports.DriverReceivedCash = function(orderId,driverId){

  var deferred = Q.defer();

  Q.all([exports.getTravelOrder(orderId),Q.resolve(driverId)]).spread(function(order,driverId){

        order.PayMethod = "Cash";
        order.PayAmount = order.ActPrice;
        order.PayCurrency = order.Currency;
        order.PayTransDate = new Date();
        order.IsVerified = 1;
        order.IsPayTransSucceed = 1;
        order.IsPaid = 1;

        exports.updateTravelOrder(order).then(function(newOrder){

                  NotificationHelper.DriverReceivedCash(newOrder._id);
                  deferred.resolve( newOrder);
        });


    });

   return deferred.promise;

};

exports.UserPayByPersonalCard = function(orderId,cardId,cardCurry){

  var deferred = Q.defer();

  Q.all([exports.getTravelOrder(orderId),Q.resolve(cardId),Q.resolve(cardCurry)]).spread(function(order,cardId,cardCurry){

        order.PayMethod = "UserPayCard";
        order.UserPayCard = cardId;
        order.PayAmount = order.ActPrice;
        order.PayCurrency = cardCurry;
        order.PayTransDate = new Date();
        order.IsVerified = 1;
        order.IsPayTransSucceed = 1;
        order.IsPaid = 1;

        exports.updateTravelOrder(order).then(function(newOrder){

                NotificationHelper.UserPaidByCard(newOrder._id);
                deferred.resolve( newOrder);
        });


    });

   return deferred.promise;

};

exports.UserPayByBusinessCard = function(orderId,cardId,cardCurry){

  var deferred = Q.defer();

  Q.all([exports.getTravelOrder(orderId),Q.resolve(cardId),Q.resolve(cardCurry)]).spread(function(order,cardId,cardCurry){

        order.PayMethod = "UserPayCard";
        order.BusinessCard = cardId;
        order.PayAmount = order.ActPrice;
        order.PayCurrency = cardCurry;
        order.PayTransDate = new Date();
        order.IsVerified = 1;
        order.IsPayTransSucceed = 1;
        order.IsPaid = 1;

        exports.updateTravelOrder(order).then(function(newOrder){

                NotificationHelper.UserPaidByCard(newOrder._id);
                deferred.resolve( newOrder);
        });


    });

   return deferred.promise;

};


//------------------------ Void Trip ------------------------
function MemberVoidTripMate(member,voidLat,voidLong){

console.log("MemberVoidTripMate");
        var deferred = Q.defer();

        if(member.Status == "Open" || member.Status == "Requested" || member.Status == "DriverRejected"|| member.Status == "BiddingAccepted" ){

            member.remove(function(err){
                if(err)
                    deferred.resolve(member);
                else
                    deferred.resolve(null);
            });

            return deferred.promise;
        }

        member.Status =  (member.Status == "DriverAccepted" || member.Status == "DriverPicking") ?  "VoidedBfPickupByUser" : "VoidedAfPickupByUser";

        exports.updateTravelOrder(member).then(function(member){

                Q.all([exports.getTravelOrder(member.MateHostOrder),Q.resolve(member)])
                .spread(function(host,member){

                      if(host != null){
                          NotificationHelper.UserShouldInvalidateOrder(host.User,host._id);
                          NotificationHelper.MemberLeaveFromTripMate(member._id,host._id);
                        }

                });

                deferred.resolve( member);

        });

        return deferred.promise;
}

function HostVoidTripMate(host,voidLat,voidLong){

        var deferred = Q.defer();

        if(isHasDriver(host) == false ){

              Q.all([exports.GetMateSubOrdersByHostId(host._id),GetRequestingTripMemberOrdersByHostId(host._id),Q.resolve(host)]).spread(function(orders,reqOrders,host){

                    if(orders.length + reqOrders.length <= 0){

                              host.remove(function(err){
                                  if(err)
                                      deferred.resolve(host);
                                  else
                                      deferred.resolve(null);
                              });

                    }else{

                              host.MateStatus = "Voided";
                              host.Status = "VoidedBfChooseDriver";

                              exports.updateTravelOrder(host).then(function(host){

                                        deferred.resolve( host);

                                        exports.GetRequestingTripMemberOrdersByHostId(host._id).then(function (orders){

                                                for (var i = 0; i < orders.length; i++){
                                                    NotificationHelper.UserShouldInvalidateOrder(orders[i].User,orders[i]._id);
                                                    NotificationHelper.HostVoidTripMate(orders[i]._id,orders[i].MateHostOrder);
                                                }
                                        });

                                        exports.GetMateSubOrdersByHostId(host._id).then(function (orders){

                                                 for (var i = 0; i < orders.length; i++){
                                                    NotificationHelper.UserShouldInvalidateOrder(orders[i].User,orders[i]._id);
                                                    NotificationHelper.HostVoidTripMate(orders[i]._id,orders[i].MateHostOrder);
                                                  }
                                        });
                              });
                    }

                });


        }else{

            host.Status =  (host.Status == "DriverAccepted" || host.Status == "DriverPicking") ?  "VoidedBfPickupByUser" : "VoidedAfPickupByUser";

            if(host.Status == "VoidedBfPickupByUser"){

                    console.log("Void host : VoidedBfPickupByUser");
                    exports.updateTravelOrder(host).then(function(newHost){

                            deferred.resolve( newHost);

                            NotificationHelper.UserVoidedBfPickup(newOrder._id);

                             Q.all([GetMateSubOrdersByHostId(newHost._id),Q.resolve(newHost)]).spread(function(orders,newHost){

                                        for (var i = 0; i < orders.length; i++){
                                           NotificationHelper.UserShouldInvalidateOrder(orders[i].User,orders[i]._id);
                                           NotificationHelper.HostVoidTripMate(orders[i]._id,orders[i].MateHostOrder);
                                         }

                             });

                    });

            }else{


                host.ActDropLoc = [voidLat,voidLong];
                host.ActDropTime = new Date();

                Q.all([GoogleHelper.getAddress(voidLat,voidLong),Q.resolve(host)]).spread(function(strAddress,host){

                      host.ActDropPlace = strAddress;
                      host.Status = "VoidedAfPickupByUser";
                      console.log("Void host : VoidedAfPickupByUser");

                      exports.updateTravelOrder(host).then(function(newHost){

                               deferred.resolve( newHost);

                               NotificationHelper.UserVoidedAfPickup(newOrder._id);

                               Q.all([GetMateSubOrdersByHostId(newHost._id),Q.resolve(newHost)]).spread(function(orders,newHost){

                                          for (var i = 0; i < orders.length; i++){
                                             NotificationHelper.UserShouldInvalidateOrder(orders[i].User,orders[i]._id);
                                             NotificationHelper.HostVoidTripMate(orders[i]._id,orders[i].MateHostOrder);
                                           }

                               });

                      });


                });
            }
        }


        return deferred.promise;
}

function UserVoidNormalTrip(order,voidLat,voidLong){

        var deferred = Q.defer();

        if(order.Status == "Open" || order.Status == "Requested" || order.Status == "DriverRejected"|| order.Status == "BiddingAccepted" ){

            order.remove(function(err){
                if(err)
                    deferred.resolve(order);
                else
                    deferred.resolve(null);
            });

            return deferred.promise;
        }

        order.Status =  (order.Status == "DriverAccepted" || order.Status == "DriverPicking") ?  "VoidedBfPickupByUser" : "VoidedAfPickupByUser";

        if(order.Status == "VoidedBfPickupByUser"){

                exports.updateTravelOrder(order).then(function(newOrder){

                        NotificationHelper.UserVoidedBfPickup(newOrder._id);
                        deferred.resolve( newOrder);
                });

        }else{

            order.ActDropLoc = [voidLat,voidLong];
            order.ActDropTime = new Date();

            Q.all([GoogleHelper.getAddress(voidLat,voidLong),Q.resolve(order)]).spread(function(strAddress,order){

                  order.ActDropPlace = strAddress;
                  order.Status = "VoidedAfPickupByUser";

                  exports.updateTravelOrder(order).then(function(newOrder){

                           NotificationHelper.UserVoidedAfPickup(newOrder._id);
                           deferred.resolve( newOrder);

                  });


            });
        }

        return deferred.promise;
}

function DriverVoidTripMate(host,voidLat,voidLong){

        var deferred = Q.defer();

        host.Status =  (host.Status == "DriverAccepted" || host.Status == "DriverPicking") ?  "VoidedBfPickupByDriver" : "VoidedAfPickupByDriver";

        if(host.Status == "VoidedBfPickupByDriver"){

                exports.updateTravelOrder(host).then(function(newHost){

                          NotificationHelper.DriverVoidedBfPickup(newOrder._id);

                         Q.all([GetMateSubOrdersByHostId(newHost._id),Q.resolve(newHost)]).spread(function(orders,newHost){

                                    for (var i = 0; i < orders.length; i++){
                                       NotificationHelper.UserShouldInvalidateOrder(orders[i].User,orders[i]._id);
                                       NotificationHelper.DriverVoidTripMate(orders[i]._id,orders[i].MateHostOrder);
                                     }

                                  deferred.resolve( newHost);
                         });

                });

        }else{


            host.ActDropLoc = [voidLat,voidLong];
            host.ActDropTime = new Date();

            Q.all([GoogleHelper.getAddress(voidLat,voidLong),Q.resolve(host)]).spread(function(strAddress,host){

                  host.ActDropPlace = strAddress;
                  host.Status = "VoidedAfPickupByDriver";

                  exports.updateTravelOrder(host).then(function(newHost){

                          NotificationHelper.DriverVoidedAfPickup(newOrder._id);

                           Q.all([GetMateSubOrdersByHostId(newHost._id),Q.resolve(newHost)]).spread(function(orders,newHost){

                                   for (var i = 0; i < orders.length; i++)
                                       NotificationHelper.UserShouldInvalidateOrder(orders[i].User,orders[i]._id);

                                    deferred.resolve( newHost);
                           });

                  });


            });
        }



        return deferred.promise;
}

function DriverVoidNormalTrip(host,voidLat,voidLong){

        var deferred = Q.defer();

        host.Status =  (host.Status == "DriverAccepted" || host.Status == "DriverPicking") ?  "VoidedBfPickupByDriver" : "VoidedAfPickupByDriver";

        if(host.Status == "VoidedBfPickupByDriver"){

                exports.updateTravelOrder(host).then(function(newHost){

                        NotificationHelper.DriverVoidedBfPickup(newOrder._id);
                        deferred.resolve( newHost);
                });

        }else{

            host.ActDropLoc = [voidLat,voidLong];
            host.ActDropTime = new Date();

            Q.all([GoogleHelper.getAddress(voidLat,voidLong),Q.resolve(host)]).spread(function(strAddress,host){

                  host.ActDropPlace = strAddress;
                  host.Status = "VoidedAfPickupByDriver";

                  exports.updateTravelOrder(host).then(function(newHost){

                           NotificationHelper.DriverVoidedAfPickup(newOrder._id);
                           deferred.resolve( newHost);

                  });


            });
        }

        return deferred.promise;
}



//---------------------------- TripMate Creation  ----------------------------------


exports.CanUserCreateTripMateOrder = function(orderId){

      var deferred = Q.defer();

      exports.getTravelOrder(orderId).then(function(order){

              TravelOrder.find({
                                  User : order.User,
                                  Status : { $in : ["VoidedBfChooseDriver","VoidedBfPickupByUser","VoidedAfPickupByUser","Finished"] }
                          }).sort({createdAt: -1}).limit(LAST_FINISHED_TRIPS)
              .exec(function(error,data){

                          if (error || data == null) {
                              deferred.reject(false);
                          }
                          else {

                              var iCount = 0;
                              for(var i = 0; i < data.length;i++){
                                  var order = data[i];
                                  if(order.Status == "Finished" && order.IsPaid == 1)
                                      iCount++;
                              }

                              deferred.resolve(iCount < LAST_ACCEPTED_FINISHED_TRIPS ? false : true);
                          }
               });

      });

      return deferred.promise;

};

exports.HostCreateTripMate = function(orderId){

      var deferred = Q.defer();

      Q.all([exports.CanUserCreateTripMateOrder(orderId),exports.getTravelOrder(orderId)]).spread(function(isOk,order){

                  if(isOk){

                      order.IsMateHost = 1;
                      order.MateStatus = null;

                      if(order.OrderPickupTime == null)
                          order.OrderPickupTime = new Date().getTime() + 1000*60*10;

                      exports.updateTravelOrder(order).then(function(order){

                            deferred.resolve(order);

                      });

                  }else{

                      deferred.resolve(order);
                  }

      });

      return deferred.promise;

};

exports.GetNearestMateHostOrders = function(orderId){

        var deferred = Q.defer();

        exports.getTravelOrder(orderId).then(function (order){

              var queryBuilder=TravelOrder.find({

                  IsMateHost : 1,
                  Status : "Open",
                  MateStatus : { $in : [null,"Rejected"] },

                  OrderPickupLoc: {  $near: order.OrderPickupLoc,  $maxDistance: 500000  }

              });

              if(order.OrderVehicleType != null)
                  queryBuilder = queryBuilder.find({  OrderVehicleType : { $in : [null,order.OrderVehicleType] }});

              if(order.OrderQuality != null)
                  queryBuilder = queryBuilder.find({  OrderQuality : { $in : [null,order.OrderQuality] }});

              queryBuilder.exec(function(error, data) {

                    var promises = [];

                    for(var i = 0; i < data.length;i++){
                        var host = data[i];
                        var promise =  TryToGetValidHost(host,order);
                        promises.push(promise);
                    }

                    promises.push(Q.resolve(order));
                    Q.all(promises).then(function(validHosts){

                            order = validHosts[validHosts.length - 1];
                            var hostList = [];
                            for(var i = 0; i < validHosts.length - 1;i++){
                                var host = validHosts[i];
                                if(host != null)
                                    hostList.push(host);
                            }

                            var sortFunction = function(order) {
                                return function(host1, host2) {
                                    return CalculateRequestingOrderBenifitPct(host2,order) - CalculateRequestingOrderBenifitPct(host1,order);
                                }
                            };

                            hostList.sort(sortFunction(order));

                            var getResultFunction = function(host,order) {

                                    var deferred = Q.defer();
                                    Q.all([Q.resolve(host),exports.getTravelOrder(host._id),Q.resolve(order),EstimatePickupTime(host,order)])
                                    .spread(function(host,oldHost,order,newPickupTime){

                                          var newPrice = CalculateMateMemberOrderPrice(host,order);
                                          var lowestPrice = CalculateRequestingOrderLowestNewPrice(host,order);

                                          var result = {
                                               HostId : host._id,
                                               OrderPickupPlace : host.OrderPickupPlace,
                                               OrderDropPlace : host.OrderDropPlace,
                                               OrderQuality : host.OrderQuality,
                                               OrderVehicleType : host.OrderVehicleType,
                                               OrderPickupTime : newPickupTime,
                                               MateOrderPrice : newPrice,
                                               MateBenifit : order.OrderPrice - newPrice,
                                               MateLowestPrice : lowestPrice,
                                               MinRemainMemberQty : oldHost.MinSubMembers - oldHost.MateSubMembers,
                                               MaxRemainMemberQty : oldHost.MaxSubMembers - oldHost.MateSubMembers
                                          };
                                          deferred.resolve(result);

                                    });
                                    return deferred.promise;
                            };

                            var promises = [];

                            for(var i = 0; i < hostList.length;i++){
                                  var host = hostList[i];
                                  if(host != null){
                                      var promise =  getResultFunction(host,order);
                                      promises.push(promise);
                                  }
                            }

                            Q.all(promises).then(function(data){

                                  var resultList = [];
                                  for (var i = 0; i < data.length; i++) {
                                      if(data[i] != null)
                                          resultList.push(data[i]);
                                  }
                                  deferred.resolve(resultList);
                            });

                    });

              });

      });

      return deferred.promise;

};

exports.UserPreviewMateHostOrder = function(orderId,hostId){

      var deferred = Q.defer();
      Q.all([exports.getTravelOrder(hostId),exports.getTravelOrder(orderId)]).spread(function(host,order){

            Q.all([Q.resolve(host),TryToAssignOrderToHost(host,order)]).spread(function(host,newHost){

                    deferred.resolve((newHost != null) ? newHost : host);

            });
      });

      return deferred.promise;

}

exports.MemberRequestToJoinTripMate = function(orderId,hostId){

      var deferred = Q.defer();

      exports.getTravelOrder(orderId).then(function(order){

              order.MateStatus = "Requested";
              order.MateHostOrder = hostId;
              exports.updateTravelOrder(order).then(function(order){

                    Q.all([Q.resolve(order),exports.RecalculateTripOrder(order.MateHostOrder)]).spread(function(order,newHost){

                            NotificationHelper.UserShouldInvalidateOrder(newHost.User,newHost._id);
                            NotificationHelper.MateMemberSentRequest(order._id,newHost._id);

                            exports.RecalculateTripOrder(order._id).then(function(order){

                                    deferred.resolve(order);

                            });

                    });

              });

      });

      return deferred.promise;

};

exports.HostAcceptMateMember = function(orderId){

      var deferred = Q.defer();

      exports.getTravelOrder(orderId).then(function(order){

              order.MateStatus = "Accepted";
              exports.updateTravelOrder(order).then(function(order){

                    Q.all([Q.resolve(order),exports.RecalculateTripOrder(order.MateHostOrder)]).spread(function(order,newHost){

                            exports.RecalculateTripOrder(order._id).then(function(order){

                                    NotificationHelper.UserShouldInvalidateOrder(order.User,order._id);
                                    NotificationHelper.HostAcceptMateMember(order._id,order.MateHostOrder);

                                    deferred.resolve(order);

                            });

                    });

              });

      });

      return deferred.promise;

};

exports.HostRejectMateMember = function(orderId){

      var deferred = Q.defer();

      exports.getTravelOrder(orderId).then(function(order){

              var hostId = null;
              if(order.MateHostOrder != null)
                  hostId = new String(order.MateHostOrder);

              order.MateStatus = "Rejected";
              order.MateHostOrder = null;

              Q.all([Q.resolve(hostId),exports.updateTravelOrder(order)]).spread(function(hostId,order){

                    exports.RecalculateTripOrder(hostId).then(function(host){

                    });

                    NotificationHelper.UserShouldInvalidateOrder(order.User,order._id);
                    NotificationHelper.HostRejectMateMember(order._id,hostId);

                    deferred.resolve(order);
              });

      });

      return deferred.promise;

};

exports.MemberLeaveFromTripMate = function(orderId){

      var deferred = Q.defer();

      exports.getTravelOrder(orderId).then(function(order){

              var hostId = null;
              if(order.MateHostOrder != null)
                  hostId = new String(order.MateHostOrder);

              var oldMateStatus = order.MateStatus;
              order.MateStatus = null;
              order.MateHostOrder = null;

              Q.all([Q.resolve(hostId),Q.resolve(oldMateStatus),exports.updateTravelOrder(order)]).spread(function(hostId,oldMateStatus,order){

                    exports.RecalculateTripOrder(hostId).then(function(host){
                          NotificationHelper.UserShouldInvalidateOrder(host.User,host._id);
                    });

                    if(oldMateStatus == "Accepted" || oldMateStatus == "Closed")
                        NotificationHelper.MemberLeaveFromTripMate(order._id,hostId);
                    deferred.resolve(order);
              });
      });

      return deferred.promise;

};

exports.HostCloseTripMate = function(hostId){

      var deferred = Q.defer();

      exports.getTravelOrder(hostId).then(function(host){

              host.MateStatus = "Closed";

              exports.updateTravelOrder(host).then(function(host){

                    RecalculateMateMemberOrders(host).then(function(host,orders){

                        for (var i = 0; i < orders.length; i++){
                            NotificationHelper.UserShouldInvalidateOrder(orders[i].User,orders[i]._id);
                            NotificationHelper.HostCloseTripMate(orders[i]._id,host._id);
                        }

                    });

                    deferred.resolve(host);
              });
      });

      return deferred.promise;

};

function TryToAssignOrderToHost(host,newOrder){

      var deferred = Q.defer();

        Q.all([Q.resolve(host),Q.resolve(newOrder),exports.GetMateSubOrdersByHostId(host._id)])
        .spread(function(host,newOrder,oldOrders){

                  var orders = [];
                  for (var i = 0; i < oldOrders.length; i++) {
                    orders.push(oldOrders[i]);
                  }
                  orders.push(newOrder);

                  tryCalculateHostWithOrders(host,orders).then(function(newHost){

                        deferred.resolve(newHost);

                  });

        });

     return deferred.promise;
}

function TryToGetValidHost(host,order){

          var deferred = Q.defer();


          if( host.MaxSubMembers <  host.MateSubMembers + order.MembersQty){
            if(host._id == hostIdToLog)
                console.log("isValidMate = false at case 0");
            deferred.resolve(null);
            return deferred.promise;
          }

          if(order.OrderPickupTime != null){
              var diffMinutes = (order.OrderPickupTime.getTime() - new Date().getTime()) / (1000*60) ;
              if(diffMinutes < -MAX_MATE_VALID_MINUTES ){
                if(host._id == hostIdToLog)
                    console.log("isValidMate = false at case 1");
                deferred.resolve(null);
                return deferred.promise;
              }
          }


          var dHostPckToOrderPck = distance(host.OrderPickupLoc[0],host.OrderPickupLoc[1], order.OrderPickupLoc[0],order.OrderPickupLoc[1]);
          var dHostPckToOrderDrp = distance(host.OrderPickupLoc[0],host.OrderPickupLoc[1], order.OrderDropLoc[0],order.OrderDropLoc[1]);
          if(dHostPckToOrderPck > host.OrderDistance || dHostPckToOrderDrp >  host.OrderDistance || dHostPckToOrderPck > dHostPckToOrderDrp){
            if(host._id == hostIdToLog){
                console.log("isValidMate = false at case 6");
                console.log("dHostPckToOrderPck > host.OrderDistance :" + (dHostPckToOrderPck > host.OrderDistance));
                console.log("dHostPckToOrderDrp > host.OrderDistance :" + (dHostPckToOrderDrp > host.OrderDistance));
                console.log("dHostPckToOrderPck > dHostPckToOrderDrp :" + (dHostPckToOrderPck > dHostPckToOrderDrp));
            }
            deferred.resolve(null);
            return deferred.promise;
          }

          var dHostDrpToOrderPck = distance(host.OrderDropLoc[0],host.OrderDropLoc[1], order.OrderPickupLoc[0],order.OrderPickupLoc[1]);
          var dHostDrpToOrderDrp = distance(host.OrderDropLoc[0],host.OrderDropLoc[1], order.OrderDropLoc[0],order.OrderDropLoc[1]);
          if(dHostDrpToOrderPck > host.OrderDistance || dHostDrpToOrderDrp >  host.OrderDistance || dHostDrpToOrderPck < dHostDrpToOrderDrp){
            if(host._id == hostIdToLog){
                console.log("isValidMate = false at case 7");
                console.log("dHostDrpToOrderPck > host.OrderDistance :" + (dHostDrpToOrderPck > host.OrderDistance));
                console.log("dHostDrpToOrderDrp > host.OrderDistance :" + (dHostDrpToOrderDrp > host.OrderDistance));
                console.log("dHostDrpToOrderPck < dHostDrpToOrderDrp :" + (dHostDrpToOrderPck < dHostDrpToOrderDrp));
              }
            deferred.resolve(null);
            return deferred.promise;
          }

          /*
          var dHostPckToHostDrop = distance(host.OrderPickupLoc[0],host.OrderPickupLoc[1], host.OrderDropLoc[0],host.OrderDropLoc[1]);

          var p = (dHostPckToHostDrop + dHostPckToOrderPck + dHostDrpToOrderPck)/2;
          var dHeightFromPickup = Math.sqrt(p * (p - dHostPckToHostDrop)* (p - dHostPckToOrderPck)* (p - dHostDrpToOrderPck)) * 2 / dHostPckToHostDrop;
          if(dHeightFromPickup > 0.6 * dHostPckToHostDrop){
            if(host._id == hostIdToLog)
                console.log("isValidMate = false at case 8");
            deferred.resolve(null);
            return deferred.promise;
          }

          p = (dHostPckToHostDrop + dHostPckToOrderDrp + dHostDrpToOrderDrp)/2;
          var dHeightFromDrop = Math.sqrt(p * (p - dHostPckToHostDrop)* (p - dHostPckToOrderDrp)* (p - dHostDrpToOrderDrp)) * 2 / dHostPckToHostDrop;
          if(dHeightFromDrop > 0.6 * dHostPckToHostDrop){
            if(host._id == hostIdToLog)
                console.log("isValidMate = false at case 9");
            deferred.resolve(null);
            return deferred.promise;
          }

          */

          Q.all([Q.resolve(host),Q.resolve(order),GoogleHelper.getDirections(host.OrderPickupLoc[0],host.OrderPickupLoc[1], order.OrderPickupLoc[0],order.OrderPickupLoc[1])])
          .spread(function(host,order,direction){

                  var totalDistance = parseFloat(direction.distance); // khoang cach don khach
                  var velocity = (host.OrderDuration > 0  && host.OrderDistance > 0 ) ? (host.OrderDistance / host.OrderDuration) : (AVG_VELOCITY_KM_PER_HOUR * 1000)/(60*60); // m/s
                  var duration = totalDistance / velocity ; // second
                  var minutesToPickup =  duration / 60;  // thoi gian don khach

                  if(host.OrderPickupTime == null){

                      if(order.OrderPickupTime == null){

                          var diffMinutes = Math.abs(host.updatedAt.getTime() - new Date().getTime()) / (1000*60) ;
                          if(Math.abs(minutesToPickup - diffMinutes) >= Math.max(MAX_MATE_VALID_MINUTES,minutesToPickup,((order.OrderDistance/1000)/10)*60) ){ // 10Km cho them 1 tieng
                            if(host._id == hostIdToLog)
                                console.log("isValidMate = false at case 2");
                            deferred.resolve(null);
                            return;
                          }

                      }else{

                          var diffMinutes = Math.abs(host.updatedAt.getTime() - order.OrderPickupTime.getTime()) / (1000*60) ;
                          if(Math.abs(minutesToPickup - diffMinutes) >= Math.max(MAX_MATE_VALID_MINUTES,minutesToPickup,((order.OrderDistance/1000)/10)*60) ){ // 10Km cho them 1 tieng
                            if(host._id == hostIdToLog)
                                console.log("isValidMate = false at case 3");
                            deferred.resolve(null);
                            return;
                          }

                      }

                  }else{

                      if(order.OrderPickupTime == null){

                          var diffMinutes = Math.abs(host.OrderPickupTime.getTime() - new Date().getTime()) /(1000*60) ;
                          if(Math.abs(minutesToPickup - diffMinutes) >= Math.max(MAX_MATE_VALID_MINUTES,minutesToPickup,((order.OrderDistance/1000)/10)*60) ){ // 10Km cho them 1 tieng
                            if(host._id == hostIdToLog){
                                console.log("isValidMate = false at case 4");
                                console.log("totalDistance = " + totalDistance);
                                console.log("diffMinutes = " + diffMinutes);
                                console.log("minutesToPickup = " + minutesToPickup);
                                console.log("Math.abs(minutesToPickup - diffMinutes) = " + Math.abs(minutesToPickup - diffMinutes));
                                console.log("Math.max(MAX_MATE_VALID_MINUTES,minutesToPickup,((order.OrderDistance/1000)/10)*60) = " + Math.max(MAX_MATE_VALID_MINUTES,minutesToPickup,((order.OrderDistance/1000)/10)*60));
                              }
                            deferred.resolve(null);
                            return;
                          }


                      }else{

                          var diffMinutes = Math.abs(host.OrderPickupTime.getTime() - order.OrderPickupTime.getTime()) / (1000*60) ;

                          if(Math.abs(minutesToPickup - diffMinutes) >= Math.max(MAX_MATE_VALID_MINUTES,minutesToPickup,((order.OrderDistance/1000)/10)*60) ){ // 10Km cho them 1 tieng
                            if(host._id == hostIdToLog)
                                console.log("isValidMate = false at case 5");

                            deferred.resolve(null);
                            return;
                          }

                      }

                  }

                  Q.all([exports.getTravelOrder(host._id),Q.resolve(order),TryToAssignOrderToHost(host,order)])
                  .spread(function(oldHost,order,newHost){

                          var hostOldBenifitPct = (oldHost.OrderPrice - oldHost.MateOrderPrice)/oldHost.OrderPrice;
                          var hostNewBenifitPct =  (newHost.OrderPrice - newHost.MateOrderPrice)/newHost.OrderPrice;

                          var increasePct = (hostOldBenifitPct <= 0) ? hostNewBenifitPct : ((hostNewBenifitPct - hostOldBenifitPct )/hostOldBenifitPct);
                          if(increasePct < MIN_HOST_INCREASE_BENIFIT_PERCENT){

                              if(oldHost._id == hostIdToLog)
                                  console.log("isValidMate = false at case 10");
                              deferred.resolve(null);
                              return;

                          }

                          if(CalculateRequestingOrderBenifitPct(newHost,order) < MIN_MATEMEMBER_BENIFIT_PERCENT){
                              if(newHost._id == hostIdToLog)
                                  console.log("isValidMate = false at case 11");
                              deferred.resolve(null);
                              return;
                          }

                          deferred.resolve(newHost);

                  });


          });


          return deferred.promise;
};

function CalculateMateMemberOrderPrice(newHost,order){

        var totalWeight = (newHost.MembersQty * newHost.OrderDistance) + newHost.MateSubWeight;
        var ratio = (order.MembersQty * order.OrderDistance) / totalWeight;
        var newPrice =  newHost.HostOrderPrice * ratio;

        var additionalRatio = (order.MembersQty * order.OrderDistance) /  newHost.MateSubWeight;
        var additionalShare = newHost.MateOrderPrice * HOST_DISCOUNT_PERCENT * additionalRatio;
        newPrice += additionalShare;

        return newPrice;
};

function CalculateRequestingOrderLowestNewPrice(newHost,order){

        var totalWeight = ((newHost.MembersQty + newHost.MaxSubMembers - newHost.MateSubMembers)* newHost.OrderDistance) + newHost.MateSubWeight;
        var ratio = (order.MembersQty * order.OrderDistance) / totalWeight;
        var newPrice =  newHost.HostOrderPrice * ratio;

        var additionalRatio = (order.MembersQty * order.OrderDistance) /  (((newHost.MaxSubMembers - newHost.MateSubMembers)* newHost.OrderDistance) + newHost.MateSubWeight);
        var additionalShare = newHost.MateOrderPrice * HOST_DISCOUNT_PERCENT * additionalRatio;
        newPrice += additionalShare;

        return newPrice;
};

function CalculateRequestingOrderBenifitPct(newHost,order){

        var newPrice =  CalculateMateMemberOrderPrice(newHost,order);

        var benifitAmt = order.OrderPrice - newPrice;
        var benifitPct = benifitAmt/order.OrderPrice;

        return benifitPct;
};

function EstimatePickupTime(newHost,order){

    var deferred = Q.defer();

    var points = [];
    for(var i = 0; i < newHost.HostPoints.length-1;i+=2){

        var pointLat = newHost.HostPoints[i];
        var pointLong = newHost.HostPoints[i+1];

        if(points.length == 0 && newHost.OrderPickupLoc != null && newHost.OrderPickupLoc.length == 2 && newHost.OrderPickupLoc[0] == pointLat  && newHost.OrderPickupLoc[1] == pointLong ){
           points.push(newHost.OrderPickupLoc);

        }else if(points.length > 0 && order.OrderPickupLoc != null && order.OrderPickupLoc.length == 2 && order.OrderPickupLoc[0] == pointLat  && order.OrderPickupLoc[1] == pointLong ){
           points.push(order.OrderPickupLoc);
           break;

        }else if(points.length > 0){
          points.push([pointLat,pointLong]);
        }

    }


    var promises = [];

    var totalDistance = 0;
    for(var i = 0; i < points.length - 1;i++){
        var sourcePoint = points[i];
        var destinyPoint = points[i+1];

        var promise =  GoogleHelper.getDirections(sourcePoint[0],sourcePoint[1], destinyPoint[0],destinyPoint[1]);
        promises.push(promise);
    }

    promises.push(Q.resolve(newHost));

    Q.all(promises).then(function(results){

          var newHost = results[results.length-1];

          var totalDistance = 0;
          for (var i = 0; i < results.length-1; i++) {
              if(results[i] != null)
                totalDistance += parseFloat(results[i].distance);
          }

          var velocity = (newHost.OrderDuration > 0  && newHost.OrderDistance > 0 ) ? (newHost.OrderDistance / newHost.OrderDuration) : (AVG_VELOCITY_KM_PER_HOUR * 1000)/(60*60); // m/s

          var duration = totalDistance / velocity ; // khoang thoi gian di don

          var newPickupTime = (newHost.OrderPickupTime != null ) ? newHost.OrderPickupTime.getTime() : new Date().getTime();
          newPickupTime += (duration * 1000);

          deferred.resolve(new Date(newPickupTime));
    });

    return deferred.promise;
}






//---------------------------- Recalculate Order ----------------------------------

exports.RecalculateTripOrder = function(orderId){

          var deferred = Q.defer();

          exports.getTravelOrder(orderId).then(function (order){

                  if(order.IsMateHost == 0){

                       if(isTripMateRequestingMember(order)){

                               RecalculateRequestingTripMemberOrder(order).then(function (newOrder){

                                     deferred.resolve( newOrder);

                               });

                       }else if(isTripMateMember(order)){

                              RecalculateMateMemberOrder(order).then(function (newOrder){

                                      deferred.resolve( newOrder);

                              });

                        }else{

                              RecalculateNormalOrder(order).then(function (newOrder){

                                      deferred.resolve( newOrder);

                              });

                        }

                  }else{

                        RecalculateMateHostOrder(order).then(RecalculateMateMemberOrders).then(function (host,orders){

                               host.save(function (err, newHost) {

                                         Q.all([RecalculateRequestingTripMemberOrdersByHostId(newHost._id),Q.resolve(newHost)]).spread(function(orders,newHost){
                                                  deferred.resolve( newHost);
                                         });

                               });

                        });

                  }

          });


          return deferred.promise;
};

//---------------------------- Recalculate Normal Order ----------------------------------

function RecalculateNormalOrder(order){

      var deferred = Q.defer();

      order.MateSubMembers = 0;
      order.MateSubWeight = 0;

      if(isTripNotYetStarted(order) ){

              order.ActPickupLoc = [];
              order.ActPickupPlace = null;
              order.ActPickupCountry = null;
              order.ActPickupTime = null;
              order.ActDropLoc = [];
              order.ActDropPlace = null;
              order.ActDropTime = null;
              order.ActPoints = [];
              order.ActDistance = null;
              order.ActCompanyPrice = null;
              order.ActCompanyAdjust = null;
              order.ActCompanyProm = null;
              order.ActSysProm = null;
              order.ActPrice = 0;
      }

      if(!isTripStopped(order)){

              order.PayMethod = null;
              order.PayCurrency = null;
              order.PayAmount = null;
              order.UserPayCard = null;
              order.BusinessCard = null;
              order.PayTransNo = null;
              order.PayTransDate = null;
              order.PayVerifyCode = null;
              order.IsVerified = 0;
              order.IsPayTransSucceed = 0;
              order.IsPaid = 0;
              order.IsPaidReconcile = 0;
      }

      InvalidateOrderDistance(order).then(InvalidateOrderPrice)
      .then(InvalidateActualDistance).then(InvalidateActualPrice)
      .then(function(order){

              order.save(function(err,newOrder){

                  if (err){
                      deferred.resolve(null);

                  }else{

                      deferred.resolve(newOrder);

                  }

              });

      });

     return deferred.promise;
}

function InvalidateOrderDistance(order){

        var deferred = Q.defer();

          if(order.Status == "VoidedBfPickupByUser" || order.Status == "VoidedBfPickupByDriver"
          || order.Status == "VoidedAfPickupByDriver"|| order.Status == "VoidedAfPickupByDriver"
          || order.Status == "Finished"){

              deferred.resolve(order);
              return deferred.promise;
          }

        if(order.OrderDropLoc == null || order.OrderDropLoc.length != 2){

            deferred.resolve(order);
            return deferred.promise;
        }

        if(order.OrderPolyline != null
          && (order.ActPickupLoc == null || order.ActPickupLoc.length != 2) &&  (order.ActDropLoc == null || order.ActDropLoc.length != 2)){

            deferred.resolve(order);
            return deferred.promise;
        }


        if(order.OrderPolyline != null
          && (order.ActPickupLoc != null && order.ActPickupLoc.length == 2) &&  (order.ActDropLoc != null && order.ActDropLoc.length == 2)){

            deferred.resolve(order);
            return deferred.promise;
        }

        var sourceLat = order.OrderPickupLoc[0];
        var sourceLong = order.OrderPickupLoc[1];

        if((order.ActPickupLoc != null && order.ActPickupLoc.length == 2)){
              sourceLat = order.ActPickupLoc[0];
              sourceLong = order.ActPickupLoc[1];
        }

        Q.all([GoogleHelper.getDirections(sourceLat,sourceLong,order.OrderDropLoc[0],order.OrderDropLoc[1]),
              Q.resolve(order)]).spread(function (data,order) {

              if(data){
                  order.OrderDistance = parseFloat(data.distance);
                  order.OrderDuration = parseFloat(data.duration);
                  order.OrderPolyline = data.polyline;
              }

              deferred.resolve(order);

        });

       return deferred.promise;
}

function InvalidateOrderPrice(order){

        var deferred = Q.defer();

        if(order.Status == "VoidedBfPickupByUser" || order.Status == "VoidedBfPickupByDriver"
        || order.Status == "VoidedAfPickupByDriver"|| order.Status == "VoidedAfPickupByDriver"
        || order.Status == "Finished"){

            deferred.resolve(order);
            return deferred.promise;
        }

        if(isHasDriver(order) || order.Status == "Requested"){

              var params = {

                  DriverId : order.Driver,
                  UserId :   order.User,
                  Currency :   order.Currency,
                  Distance :   order.OrderDistance,
                  PickupLoc :   order.OrderPickupLoc,
                  OrderPickupTime :  order.OrderPickupTime != null ? order.OrderPickupTime : new Date()

              };

              Q.all([TravelPriceHelper.CalculateTripPrice(params),Q.resolve(order)])
              .spread(function(data,order){

                    if(data != null){
                        data = JSON.parse(data);
                        order.OrderCompanyPrice = parseFloat(data.companyPriceAmt);
                        order.OrderCompanyAdjust = parseFloat(data.companyAdjustAmt);
                        order.OrderCompanyProm = parseFloat(data.companyPromotionAmt);
                        order.OrderSysProm = parseFloat(data.systemPromotionAmt);
                        order.OrderPrice = parseFloat(data.finalprice);
                    }

                    deferred.resolve(order);
              });

        }else{

              var params = {

                  PickupLoc : order.OrderPickupLoc,
                  Country :   order.OrderPickupCountry,
                  Currency :   order.Currency,
                  VehicleType :   order.OrderVehicleType,
                  QualityService :   order.OrderQuality,
                  UserId : order.User,
                  Distance :   order.OrderDistance,
                  OrderPickupTime :  order.OrderPickupTime != null ? order.OrderPickupTime : new Date()

              };

              Q.all([TravelPriceHelper.CalculateAverageTripPrice(params),Q.resolve(order)])
              .spread(function(data,order){

                    if(data != null){
                          data = JSON.parse(data);
                          order.OrderCompanyPrice = parseFloat(data.companyPriceAmt);
                          order.OrderCompanyAdjust = 0;
                          order.OrderCompanyProm = 0;
                          order.OrderSysProm = parseFloat(data.systemPromotionAmt);
                          order.OrderPrice = parseFloat(data.finalprice);
                    }

                    deferred.resolve(order);
              });

        }

       return deferred.promise;
}

function InvalidateActualDistance(order){

        var deferred = Q.defer();

        if(!isTripStopped(order) || order.ActPolyline != null || order.ActPickupLoc == null || order.ActPickupLoc.length != 2 || order.ActDropLoc == null || order.ActDropLoc.length != 2){

            deferred.resolve(order);
            return deferred.promise;
        }

        Q.all([GoogleHelper.getDirections(order.ActPickupLoc[0],order.ActPickupLoc[1],order.ActDropLoc[0],order.ActDropLoc[1]),Q.resolve(order)])
        .spread(function(data,order){

            if(data){
                order.ActDistance = parseFloat(data.distance);
                order.ActDuration = parseFloat(data.duration);
                order.ActPolyline = data.polyline;
            }

            deferred.resolve(order);

        });

        return deferred.promise;

}

function InvalidateActualPrice(order){

        var deferred = Q.defer();

        if(!isTripStopped(order) || order.ActPrice == null || order.ActPrice > 0 || order.ActPolyline == null || order.ActPickupLoc == null || order.ActPickupLoc.length != 2 || order.ActDropLoc == null || order.ActDropLoc.length != 2){

            deferred.resolve(order);
            return deferred.promise;
        }

        var params = {

            DriverId : order.Driver,
            UserId :   order.User,
            Currency :   order.Currency,
            Distance :   order.ActDistance,
            PickupLoc :   order.ActPickupLoc,
            OrderPickupTime :  order.OrderPickupTime != null ? order.OrderPickupTime : new Date()

        };

        Q.all([TravelPriceHelper.CalculateTripPrice(params),Q.resolve(order)])
        .spread(function(data,order){

              if(data != null){
                  data = JSON.parse(data);
                  order.ActCompanyPrice = parseFloat(data.companyPriceAmt);
                  order.ActCompanyAdjust = parseFloat(data.companyAdjustAmt);
                  order.ActCompanyProm = parseFloat(data.companyPromotionAmt);
                  order.ActSysProm = parseFloat(data.systemPromotionAmt);
                  order.ActPrice = parseFloat(data.finalprice);
                  order.MustPay = parseFloat(data.finalprice);
              }

              deferred.resolve(order);
        });

        return deferred.promise;

}

//---------------------------- Recalculate Host Mate Order ----------------------------------

function RecalculateMateHostOrder(host){

        var deferred = Q.defer();

        if(isTripStopped(host) && host.MateActPrice != null && host.MateActPrice >0){
            deferred.resolve(host);
            return deferred.promise;
        }

        if(isTripNotYetStarted(host) ){

                host.ActPickupLoc = [];
                host.ActPickupPlace = null;
                host.ActPickupCountry = null;
                host.ActPickupTime = null;
                host.ActDropLoc = [];
                host.ActDropPlace = null;
                host.ActDropTime = null;
                host.ActPoints = [];
                host.ActDistance = null;
                host.ActCompanyPrice = null;
                host.ActCompanyAdjust = null;
                host.ActCompanyProm = null;
                host.ActSysProm = null;
                host.ActPrice = 0;
        }

        if(!isTripStopped(host)){

                host.PayMethod = null;
                host.PayCurrency = null;
                host.PayAmount = null;
                host.UserPayCard = null;
                host.BusinessCard = null;
                host.PayTransNo = null;
                host.PayTransDate = null;
                host.PayVerifyCode = null;
                host.IsVerified = 0;
                host.IsPayTransSucceed = 0;
                host.IsPaid = 0;
                host.IsPaidReconcile = 0;
        }


        Q.all([InvalidateOrderDistance(host).then(InvalidateOrderPrice),exports.GetMateSubOrdersByHostId(host._id)])
        .spread(function(host,orders){

                        tryCalculateHostWithOrders(host,orders).then(function(host){

                              host.save(function (err, newHost, numAffected) {
                                  deferred.resolve((!err && numAffected > 0) ? newHost : host);
                              });

                        });

        });

       return deferred.promise;
}

exports.GetMateSubOrdersByHostId = function(hostId){

        var deferred = Q.defer();

        TravelOrder.find({

            IsMateHost : 0,
            MateHostOrder : hostId,
            MateStatus : { $in : ["Accepted","Closed"] }

        }).exec(function(err, orders) {

              if( !err){

                  orders.sort(function(order1, order2) { // not yet tested

                      var dHostPckToOrder1Pck = 0;
                      var dHostPckToOrder2Pck = 0;

                      if(host.ActPickupLoc != null && host.ActPickupLoc.length == 2){

                          dHostPckToOrder1Pck = distance(host.ActPickupLoc[0],host.ActPickupLoc[1], order1.OrderPickupLoc[0],order1.OrderPickupLoc[1]);
                          dHostPckToOrder2Pck = distance(host.ActPickupLoc[0],host.ActPickupLoc[1], order2.OrderPickupLoc[0],order2.OrderPickupLoc[1]);

                      }else{

                          dHostPckToOrder1Pck = distance(host.OrderPickupLoc[0],host.OrderPickupLoc[1], order1.OrderPickupLoc[0],order1.OrderPickupLoc[1]);
                          dHostPckToOrder2Pck = distance(host.OrderPickupLoc[0],host.OrderPickupLoc[1], order2.OrderPickupLoc[0],order2.OrderPickupLoc[1]);

                      }

                      return dHostPckToOrder2Pck - dHostPckToOrder1Pck;
                  });

                  deferred.resolve( orders);
              }else{

                  deferred.resolve([]);
              }

        });

       return deferred.promise;

};

function tryCalculateHostWithOrders(host,orders){

      var deferred = Q.defer();

      //<------------------------------------------  host.MateSubMembers ----------------------------------------->
      //<------------------------------------------  host.MateSubWeight ----------------------------------------->

      host.MateSubMembers = 0;
      host.MateSubWeight = 0;
      for (var i = 0; i < orders.length; i++) {
          var order = orders[i];
          host.MateSubMembers += order.MembersQty;
          host.MateSubWeight += (order.MembersQty * order.OrderDistance);

      }

      //<-------------------------------------------  host.HostPoints ------------------------------------------>
      //<------------------------------------------------------------------------------------------------------------>

      var matePoints = [];
      if(host.ActPickupLoc != null && host.ActPickupLoc.length == 2)
          matePoints.push([host,host.ActPickupLoc]);
      else
          matePoints.push([host,host.OrderPickupLoc]);

      while(matePoints.length -1 < orders.length * 2 ){

          var lastPoint = matePoints[matePoints.length - 1];

          var nearestPoint = null;
          var nearestPointOrder = null;
          var nearestValue = Number.MAX_VALUE;

          for (var i = 0; i < orders.length; i++) {

              var order = orders[i];

              var isPickupExisted = false;
              for (var j = 0; j < matePoints.length; j++) {
                if((matePoints[j][0]._id == order._id) &&
                   (matePoints[j][1][0] == order.OrderPickupLoc[0] && matePoints[j][1][1] == order.OrderPickupLoc[1])){
                   isPickupExisted = true;
                   break;
                }
              }

              if(isPickupExisted == false){

                  var distanceFromLastPoint = distance(lastPoint[1][0],lastPoint[1][1], order.OrderPickupLoc[0],order.OrderPickupLoc[1]);
                  if(distanceFromLastPoint < nearestValue){
                    nearestValue = distanceFromLastPoint;
                    nearestPoint = order.OrderPickupLoc;
                    nearestPointOrder = order;
                  }
              }

          }

          for (var i = 0; i < orders.length; i++) {

              var order = orders[i];
              var isPickupExisted = false;
              var isDropExisted = false;

              for (var j = 0; j < matePoints.length; j++) {
                if((matePoints[j][0]._id == order._id) &&
                   (matePoints[j][1][0] == order.OrderPickupLoc[0] && matePoints[j][1][1] == order.OrderPickupLoc[1])){
                   isPickupExisted = true;
                   break;
                }
              }

              for (var j = 0; j < matePoints.length; j++) {
                if((matePoints[j][0]._id == order._id) &&
                   (matePoints[j][1][0] == order.OrderDropLoc[0] && matePoints[j][1][1] == order.OrderDropLoc[1])){
                   isDropExisted = true;
                   break;
                }
              }

              if(isPickupExisted == true && isDropExisted == false){

                  var distanceFromLastPoint = distance(lastPoint[1][0],lastPoint[1][1], order.OrderDropLoc[0],order.OrderDropLoc[1]);
                  if(distanceFromLastPoint < nearestValue){
                    nearestValue = distanceFromLastPoint;
                    nearestPoint = order.OrderDropLoc;
                    nearestPointOrder = order;
                  }
              }

          }

          if(nearestPoint != null)
              matePoints.push([nearestPointOrder,nearestPoint]);
          else
              break;
      }

      if(host.ActDropLoc != null && host.ActDropLoc.length == 2)
          matePoints.push([host,host.ActDropLoc]);
      else if(host.OrderDropLoc != null && host.OrderDropLoc.length == 2)
          matePoints.push([host,host.OrderDropLoc]);

      host.HostPoints = [];
      for (var i = 0; i < matePoints.length; i++) {
          host.HostPoints.push(matePoints[i][1][0]);
          host.HostPoints.push(matePoints[i][1][1]);
      }


      //<------------------------------------------  host.HostOrderDistance ----------------------------------------->
      //<------------------------------------------  host.ActDistance ----------------------------------------->

      var promises = [];

      for (var i = 0; i <= host.HostPoints.length-3; i+=2) {

          var sourceLat = host.HostPoints[i];
          var sourceLong= host.HostPoints[i+1];
          var destinyLat = host.HostPoints[i+2];
          var destinyLong = host.HostPoints[i+3];

          var promise =  GoogleHelper.getDirections(sourceLat,sourceLong,destinyLat,destinyLong);
          promises.push(promise);
      }

      promises.push(Q.resolve(host));

      Q.all(promises).then(function(results){

            var host = results[results.length-1];

            var distance = 0;
            var encodedPolylines = [];
            for (var i = 0; i < results.length-1; i++) {
                if(results[i] != null){
                  distance += parseFloat(results[i].distance);
                  encodedPolylines.push(results[i].polyline);
                }
            }

            host.HostPolyline = encodedPolylines.join("TRUNG");

            if(isTripStopped(host))
                host.ActDistance  = distance;
            else{
                host.HostOrderDistance  = distance;
                host.MateOrderDistance  = distance;
              }

            var params = null;
            var calcPricePromise = null;
            if(host.Driver != null){

                params = {

                    DriverId : host.Driver,
                    UserId :   host.User,
                    Currency :   host.Currency,
                    Distance :   distance,
                    PickupLoc :  isTripStopped(host) ? host.ActPickupLoc : host.OrderPickupLoc,
                    OrderPickupTime :  host.OrderPickupTime != null ? host.OrderPickupTime : new Date()

                };
                calcPricePromise = TravelPriceHelper.CalculateTripPrice(params);

            }else{

                params = {

                    PickupLoc :isTripStopped(host) ? host.ActPickupLoc : host.OrderPickupLoc,
                    Country :   host.OrderPickupCountry,
                    Currency :   host.Currency,
                    VehicleType :   host.OrderVehicleType,
                    QualityService :   host.OrderQuality,
                    UserId : host.User,
                    Distance :   distance,
                    OrderPickupTime :  host.OrderPickupTime != null ? host.OrderPickupTime : new Date()

                };
                calcPricePromise = TravelPriceHelper.CalculateAverageTripPrice(params);

            }

            Q.all([calcPricePromise,Q.resolve(host)])
            .spread(function(data,host){

                  if(data != null){

                      data = JSON.parse(data);
                      var totalWeight = (host.MembersQty * host.OrderDistance) + host.MateSubWeight;
                      var ratio = (totalWeight > 0 ?  ((host.MembersQty * host.OrderDistance) / totalWeight) : 0);

                      if(isTripStopped(host)){

                            host.ActCompanyPrice = parseFloat(data.companyPriceAmt);
                            host.ActCompanyAdjust = parseFloat(data.companyAdjustAmt);
                            host.ActCompanyProm = parseFloat(data.companyPromotionAmt);
                            host.ActSysProm = parseFloat(data.systemPromotionAmt);
                            host.ActPrice = parseFloat(data.finalprice);
                            host.MustPay = parseFloat(data.finalprice);

                            host.MateActPrice =  host.ActPrice * ratio * ((host.MateSubMembers > 0) ? (1 - HOST_DISCOUNT_PERCENT) : 1);

                      }else{

                            host.HostOrderPrice = parseFloat(data.finalprice);
                            host.MateOrderPrice = host.HostOrderPrice * ratio * ((host.MateSubMembers > 0) ? (1 - HOST_DISCOUNT_PERCENT) : 1);
                      }

                  }

                  deferred.resolve(host);
            });

      });

      return deferred.promise;

}

//---------------------------- Recalculate Mate Member Order ----------------------------------

function RecalculateRequestingTripMemberOrdersByHostId(hostId){

          var deferred = Q.defer();

          GetRequestingTripMemberOrdersByHostId(hostId).then(function(orders){

                var promises = [];
                for (var i = 0; i < orders.length; i++) {
                    var promise =  RecalculateRequestingTripMemberOrder(orders[i]);
                    promises.push(promise);
                }

                Q.all(promises).then(function(results){

                      var orders = [];
                      for (var i = 0; i < results.length; i++)
                          orders[i] = results[i];

                      deferred.resolve(orders);

                });

          });

         return deferred.promise;

}

function RecalculateRequestingTripMemberOrder(order){

      var deferred = Q.defer();

      if(!isTripMateRequestingMember(order)){
          deferred.resolve(order);
          return deferred.promise;
      }

      Q.all([exports.getTravelOrder(order.MateHostOrder),RecalculateNormalOrder(order)]).spread(function(host,order){

            if(host.MateStatus == "Closed" || host.Status == "VoidedBfChooseDriver"){
               order.MateStatus = "Rejected";
               order.save(function(err,newOrder) {
                     deferred.resolve(newOrder);
               });
               return;
            }

            Q.all([Q.resolve(order),TryToAssignOrderToHost(host,order)]).spread(function(order,newHost){

                    RecalculateMateMemberOrderWithHost(newHost,order).then(function(newOrder){

                          deferred.resolve(newOrder);
                    });

            });
      });


     return deferred.promise;
}

function RecalculateMateMemberOrders(host){

        var deferred = Q.defer();

        Q.all([exports.GetMateSubOrdersByHostId(host._id),Q.resolve(host)])
        .spread(function(orders,host){

              var promises = [];
              for (var i = 0; i < orders.length; i++) {
                  var promise =  RecalculateMateMemberOrderWithHost(host,orders[i]);
                  promises.push(promise);
              }

              promises.push(Q.resolve(host));

              Q.all(promises).then(function(results){

                    var host = results[results.length-1];

                    var orders = [];
                    for (var i = 0; i < results.length-1; i++)
                        orders[i] = results[i];

                    deferred.resolve( host,orders);

              });


        });

       return deferred.promise;

}

function RecalculateMateMemberOrder(order){

        var deferred = Q.defer();

        if(!isTripMateMember(order)){
            deferred.resolve(order);
            return deferred.promise;
        }

        order.MateSubMembers = 0;
        order.MateSubWeight = 0;

        order.ActPickupLoc = [];
        order.ActPickupPlace = null;
        order.ActPickupCountry = null;
        order.ActPickupTime = null;
        order.ActDropLoc = [];
        order.ActDropPlace = null;
        order.ActDropTime = null;


        if(!isTripStopped(order)){

                order.PayMethod = null;
                order.PayCurrency = null;
                order.PayAmount = null;
                order.UserPayCard = null;
                order.BusinessCard = null;
                order.PayTransNo = null;
                order.PayTransDate = null;
                order.PayVerifyCode = null;
                order.IsVerified = 0;
                order.IsPayTransSucceed = 0;
                order.IsPaid = 0;
                order.IsPaidReconcile = 0;
        }

        InvalidateOrderDistance(order).then(InvalidateOrderPrice).then(function(order){

                Q.all([exports.getTravelOrder(order.MateHostOrder),Q.resolve(order)]).spread(function(host,order){

                      RecalculateMateMemberOrderWithHost(host,order).then(function(order){
                          deferred.resolve(order);
                      });
                });

        });

       return deferred.promise;

}

function RecalculateMateMemberOrderWithHost(host,order){

          var deferred = Q.defer();

          Q.all([Q.resolve(host),Q.resolve(order),EstimatePickupTime(host,order)])
          .spread(function(host,order,newPickupTime){

                  var totalWeight = (host.MembersQty * host.OrderDistance) + host.MateSubWeight;

                  order.IsMateHost = 0;
                  order.MaxSubMembers = 1;
                  order.MateSubMembers = null;
                  order.MateSubWeight = null;
                  order.HostPolyline = host.HostPolyline;
                  order.HostPoints = host.HostPoints;
                  order.MateHostOrder = host._id;
                  order.HostOrderPrice = host.HostOrderPrice;
                  order.HostOrderDistance = host.HostOrderDistance;
                  order.OrderPickupTime = newPickupTime;
                  order.MateOrderPrice = CalculateMateMemberOrderPrice(host,order);

                  if(host.MateStatus == "Closed")
                     order.MateStatus = "Closed";

                  if(host.Status == "VoidedBfChooseDriver")
                        order.MateStatus = "VoidedByHost";

                  if(host.Status == "DriverAccepted")
                        order.Status = "DriverAccepted";

                  if(host.Status == "DriverPicking")
                        order.Status = "DriverPicking";

                  if(host.Status == "Pickuped")
                        order.Status = "Pickuped";

                  if(host.Status == "VoidedAfPickupByUser")
                        order.Status = "VoidedAfPickupByUser";

                  if(host.Status == "VoidedAfPickupByDriver")
                        order.Status = "VoidedAfPickupByDriver";

                  if(host.Status == "Finished")
                        order.Status = "Finished";


                  order.MateActPrice = order.MateOrderPrice;
                  order.MustPay = order.MateOrderPrice;
                  order.ActCompanyPrice = null;
                  order.ActCompanyAdjust = null;
                  order.ActCompanyProm = null;
                  order.ActSysProm = null;
                  order.ActPrice = order.MateOrderPrice;
                  order.ActPolyline = null;

                  var iSource = null;
                  var iDestiny = null;

                  for (var i = 0; i < host.HostPoints.length-1; i+=2) {

                      var pointLat = host.HostPoints[i];
                      var pointLong = host.HostPoints[i+1];

                      if(order.OrderPickupLoc != null && order.OrderPickupLoc.length == 2 &&
                        pointLat == order.OrderPickupLoc[0]  && pointLong == order.OrderPickupLoc[1] ){

                          iSource = i;
                      }


                      if(order.OrderDropLoc != null && order.OrderDropLoc.length == 2 &&
                        pointLat == order.OrderDropLoc[0]  && pointLong == order.OrderDropLoc[1] ){

                          iDestiny = i;
                      }

                  }

                  var promises = [];
                  for (var i = iSource; i < iDestiny; i+=2) {

                        var sourceLat =  host.HostPoints[i];
                        var sourceLong =  host.HostPoints[i+1];
                        var destinyLat =  host.HostPoints[i+2];
                        var destinyLong =  host.HostPoints[i+3];

                        var promise =  GoogleHelper.getDirections(sourceLat,sourceLong,destinyLat,destinyLong);
                        promises.push(promise);

                  }

                  promises.push(Q.resolve(order));

                  Q.all(promises).then(function(results){

                        var order = results[results.length-1];

                        var distance = 0;
                        var strEncodedPolylines = "";
                        for (var i = 0; i < results.length-1; i++) {
                            if(results[i] != null){
                              distance += parseFloat(results[i].distance);
                              strEncodedPolylines += results[i].polyline;
                            }
                        }


                        order.ActPolyline = strEncodedPolylines;

                        order.MateOrderDistance = distance;

                        order.save(function (err, newOrder) {
                            deferred.resolve(!err  ? newOrder : order);
                        });


                  });


          });
       return deferred.promise;

}

function GetRequestingTripMemberOrdersByHostId(hostId){

          var deferred = Q.defer();

          TravelOrder.find({

              IsMateHost : 0,
              MateHostOrder : hostId,
              MateStatus : "Requested"

          }).exec(function(err, orders) {

                if( err)
                    deferred.resolve( []);
                else
                    deferred.resolve(orders);

          });

         return deferred.promise;

}





//---------------------------- Late Order ----------------------------------

exports.GetNearestLateOrders = function(coords,maxDistance,vehicleType,qualityService){

  var deferred = Q.defer();

  TravelOrder.find({
                      OrderPickupLoc: {
                                        $near: coords,
                                        $maxDistance: maxDistance /10
                                      },
                      Status : { $in : ["Open","DriverRejected"] },
                      OrderVehicleType : { $in : [null,vehicleType] },
                      OrderQuality : { $in : [null,qualityService] },
                      OrderPickupTime : { $gt : new Date()}

              }).exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.DriverCreateBidding = function(req){

    var deferred = Q.defer();

    MongoDBHelper.createObject("DriverBidding",req, null).then(function(bidding){

          if(bidding != null && ( typeof bidding.error != "undefined")){

                Q.all([exports.RecalculateBiddingByOrder(bidding.TravelOrder),Q.resolve(bidding)]).spread(function (biddings,bidding) {

                      NotificationHelper.DriverBidding(bidding.TravelOrder);

                      deferred.resolve(bidding);
                });

          }else{

              deferred.resolve(null);
          }


    });

     return deferred.promise;


};

exports.GetOpenBiddingsByOrder = function(orderId){

      var deferred = Q.defer();

      exports.RecalculateBiddingByOrder(orderId).then(function(biddings){

              DriverBidding.find({
                    TravelOrder : orderId,
                    Status      : "Open"
              })
              .sort({updatedAt: -1})
              .exec(function(err,data){

                        var response = {};
                        if(err) {
                            response = {"error" : true,"message" : err};
                        } else {
                            response = data;
                        }

                        deferred.resolve(response);
              });
      });


     return deferred.promise;
};

exports.UserAcceptBidding = function(biddingId){

  var deferred = Q.defer();

  DriverBidding.findOneAndUpdate({_id: biddingId},{Status:"Accepted"}, {new: true}).exec().then(function(bidding){

        if (bidding == null){
            deferred.resolve(null);
        }else{

                TravelOrder.findOneAndUpdate({_id: bidding.TravelOrder},{Status:"BiddingAccepted",Driver: bidding.Driver}, {new: true}).exec().then(function(order){

                          if (order == null){
                              deferred.resolve(null);

                          }else{

                              Q.all([exports.RecalculateBiddingByOrder(order._id),Q.resolve(order)]).spread(function (biddings,newOrder) {

                                      NotificationHelper.UserAcceptBidding(newOrder._id);
                                      deferred.resolve(newOrder);
                              });

                          }
                });
        }
  });

   return deferred.promise;

};

exports.UserCancelAcceptingBidding = function(biddingId){

  var deferred = Q.defer();

    DriverBidding.findOneAndUpdate({_id: biddingId},{Status:"Open"}, {new: true}).exec().then(function(bidding){

                  if (bidding == null){
                      deferred.resolve(null);
                  }else{

                      TravelOrder.findOneAndUpdate({_id: bidding.TravelOrder},{Status:"Open",Driver:null}, {new: true}).exec().then(function(order){

                                  if (order == null){
                                      deferred.resolve(null);
                                  }else{

                                        Q.all([exports.RecalculateBiddingByOrder(order._id),Q.resolve(order)]).spread(function (biddings,newOrder) {

                                            NotificationHelper.UserCancelAcceptingBidding(newOrder._id);

                                            deferred.resolve(newOrder);
                                        });
                                  }
                                });
                  }
    });
   return deferred.promise;

};

exports.RecalculateBiddingByOrder = function(orderId){

  var deferred = Q.defer();

          DriverBidding.find({
                TravelOrder : orderId,
                Status : { $in : ["Open","Accepted"]}
          }).exec(function(err, biddings) {

                var isHasAccepted = false;
                for (var i = 0; i < biddings.length; i++) {
                    var bidding = biddings[i];
                    if(bidding.Status == "Accepted"){
                      isHasAccepted = true;
                      break;
                    }
                }

                for (var i = 0; i < biddings.length; i++) {
                    var bidding = biddings[i];
                    if(bidding.Status != "Accepted"){

                      if(isHasAccepted){
                          bidding.Status = "Rejected";
                          bidding.save(function(err,doc){});
                      }else if(bidding.Status == "Open" && bidding.ExpireTime < new Date()){
                          bidding.Status = "Expired";
                          bidding.save(function(err,doc){});
                      }

                    }
                }


                deferred.resolve( !err ? biddings : []);

          });

   return deferred.promise;

};

exports.RecalculateBiddingByDriver = function(driverId){

    var deferred = Q.defer();

    DriverBidding.find({
        Driver : driverId,
        Status : "Open"
    }).exec(function(err, biddings) {

              var promises = [];
              for (var i = 0; i < biddings.length; i++) {
                  var bidding = biddings[i];
                  var promise =  exports.RecalculateBiddingByOrder(bidding.TravelOrder);
                    promises.push(promise);
              }

              Q.all(promises).then(function(results){
                    deferred.resolve(null);
              });

    });

   return deferred.promise;

};

exports.GetBiddingsByDriver = function(driverId){

      var deferred = Q.defer();

      exports.RecalculateBiddingByDriver(driverId).then(function(result){

              DriverBidding.find({
                    Driver : driverId,
                    Status : { $in : ["Open","Expired","Rejected"]}
              })
              .sort({updatedAt: -1})
              .exec(function(err,data){

                        var response = {};
                        if(err) {
                            response = {"error" : true,"message" : err};
                        } else {
                            response = data;
                        }

                        deferred.resolve(response);
              });
      });


     return deferred.promise;
};



//---------------------------- Search Drivers ----------------------------------
exports.GetNearestDriversForOrder = function(orderId,page,pagesize){

  var deferred = Q.defer();

        Q.all([exports.getTravelOrder(orderId),Q.resolve(page),Q.resolve(pagesize)])
        .spread(function(order,page,pagesize){

                if(order == null){
                   deferred.resolve([]);
                   return;
                }

                var queryBuilder=DriverStatus.find({
                    Location: {
                      $near: order.OrderPickupLoc,
                      $maxDistance: 30/111.12
                    },
                    IsReady: 1,
                    IsLocked : 0,
                    IsVehicleTaken : 1,
                    Vehicle : { $ne: null }
                });

                if(order.OrderVehicleType)
                    queryBuilder=queryBuilder.where("VehicleType",order.OrderVehicleType);

                if(order.OrderQuality)
                    queryBuilder=queryBuilder.where("QualityService",order.OrderQuality);

                if(page )
                    queryBuilder=queryBuilder.skip( parseInt(pagesize)* (parseInt(page)-1));

                queryBuilder=queryBuilder.limit( parseInt(pagesize));

                queryBuilder.exec(function(error, statuses) {

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                            var promises = [];

                            for(var i = 0; i < statuses.length;i++){
                                var status = statuses[i];
                                var promise =  TravelPriceHelper.TryToCalculateTripPrice(orderId,status.Driver);
                                promises.push(promise);
                            }

                            promises.push(exports.getTravelOrder(orderId));
                            promises.push(Q.resolve(statuses));

                            Q.all(promises).then(function(prices){

                              //  console.log("prices.length = " + prices.length);
                                var statuses = prices[prices.length-1];
                                var order = prices[prices.length-2];

                                var result = [];

                                for (var i = 0; i < prices.length-2; i++){

                                     var price = prices[i];
                                     var status = statuses[i];

                                     var obj = {

                                         DriverId : price.DriverId,
                                         OrderId :   price.OrderId,
                                         DriverName :   status.DriverName,
                                         CompanyName :   status.CompanyName,
                                         QualityService :   status.QualityService,
                                         VehicleType :   status.VehicleType,
                                         Rating :   status.Rating,
                                         RateCount :   status.RateCount,
                                         ComPrice :   price.CompanyPrice,
                                         ComAdjustPrice :   price.CompanyAdjust,
                                         ComPromPrice :   price.CompanyProm,
                                         SysPromPrice :   price.SysProm,
                                         FinalPrice :   price.FinalPrice,
                                         Distance  : distance(order.OrderPickupLoc[0],order.OrderPickupLoc[1], status.Location[0],status.Location[1])

                                     };
                                     result.push(obj);

                                }


                                result.sort(function(item1, item2) { // not yet tested
                                    return item2.FinalPrice - item1.FinalPrice;
                                });

                                deferred.resolve(result);

                            });

                      }

                });


        });


   return deferred.promise;

};




//---------------------------- Get By User ----------------------------------

exports.GetLastOpenningOrderByUser = function(userId){

  var deferred = Q.defer();

    TravelOrder.find({
                        User : userId ,
                        IsPaid : 0 ,
                        Status : { $in : ["Open","BiddingAccepted","DriverAccepted","DriverRejected",
                                          "DriverPicking","Pickuped",
                                          "VoidedAfPickupByUser","VoidedAfPickupByDriver","Finished"] }

                }).sort({createdAt: -1}).limit(1)
                .exec(function(error,result){

                        if (error) {

                              deferred.reject(new Error(error));

                        }else {
                            if(result.length > 0 )
                                deferred.resolve(result[0]);
                            else
                                deferred.resolve(null);
                        }
     });


   return deferred.promise;

};

exports.GetNotYetPaidOrderByUser = function(userId){

  var deferred = Q.defer();

  TravelOrder.find({
                      User : userId ,
                      IsPaid : 0 ,
                      Status : { $in : ["VoidedAfPickupByUser","VoidedAfPickupByDriver","Finished"] }

              }).sort({updatedAt: -1})
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.CountNotYetPaidOrderByUser = function(userId){

  var deferred = Q.defer();

  TravelOrder.find({
                      User : userId ,
                      IsPaid : 0 ,
                      Status : { $in : ["VoidedAfPickupByUser","VoidedAfPickupByDriver","Finished"] }

              }).count()
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.GetNotYetPickupOrderByUser = function(userId){

  var deferred = Q.defer();

  TravelOrder.find({
                      User : userId ,
                      Status : { $in : ["Open","BiddingAccepted","DriverAccepted","DriverRejected","DriverPicking"] }

              }).sort({updatedAt: -1})
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.CountNotYetPickupOrderByUser = function(userId){

  var deferred = Q.defer();

  TravelOrder.find({
                      User : userId ,
                      Status : { $in : ["Open","BiddingAccepted","DriverAccepted","DriverRejected","DriverPicking"] }

              }).count()
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.GetOnTheWayOrderByUser = function(userId){

  var deferred = Q.defer();

  TravelOrder.find({
                      User : userId ,
                      Status : { $in : ["Pickuped"] }

              }).sort({updatedAt: -1})
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.CountOnTheWayOrderByUser = function(userId){

  var deferred = Q.defer();

  TravelOrder.find({
                      User : userId ,
                      Status : { $in : ["Pickuped"] }

              }).count()
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

//---------------------------- Get By Driver ----------------------------------

exports.GetLastOpenningOrderByDriver = function(driverId){

  var deferred = Q.defer();

  TravelOrder.findOne({
                      Driver : driverId ,
                      Status : { $in : ["DriverAccepted","DriverPicking","Pickuped"] }

              }).sort({createdAt: 1})
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.GetNotYetPaidOrderByDriver = function(driverId){

  var deferred = Q.defer();

  TravelOrder.find({
                      Driver : driverId ,
                      IsPaid : 0,
                      Status : { $in : ["VoidedAfPickupByUser","VoidedAfPickupByDriver","Finished"] }

              }).sort({updatedAt: -1})
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.CountNotYetPaidOrderByDriver = function(driverId){

  var deferred = Q.defer();

  TravelOrder.find({
                      Driver : driverId ,
                      IsPaid : 0,
                      Status : { $in : ["VoidedAfPickupByUser","VoidedAfPickupByDriver","Finished"] }

              }).count()
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.GetNotYetPickupOrderByDriver = function(driverId){

  var deferred = Q.defer();

  TravelOrder.find({
                      Driver : driverId ,
                      Status : { $in : ["DriverAccepted","DriverPicking"] }

              }).sort({updatedAt: -1})
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.CountNotYetPickupOrderByDriver = function(driverId){

  var deferred = Q.defer();

  TravelOrder.find({
                      Driver : driverId ,
                      Status : { $in : ["DriverAccepted","DriverPicking"] }

              }).count()
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.GetOnTheWayOrderByDriver = function(driverId){

  var deferred = Q.defer();

  TravelOrder.find({
                      Driver : driverId ,
                      Status : { $in : ["Pickuped"] }

              }).sort({updatedAt: -1})
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};

exports.GetStoppedOrderByDriver = function(driverId){

  var deferred = Q.defer();

  TravelOrder.find({
                      Driver : driverId ,
                      Status : { $in : ["VoidedAfPickupByUser","VoidedAfPickupByDriver","Finished"] }

              }).sort({updatedAt: -1})
              .exec(function(error,result){

                      if (error) {
                          deferred.reject(new Error(error));
                      }
                      else {

                        deferred.resolve(result);
                      }
   });

   return deferred.promise;

};



















//--

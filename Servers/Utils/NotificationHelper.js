
var config= require ("./ServerConfig");
var Q = require('q');
var http = require('http');
const util = require('util');

var socket = require('socket.io-client')(config.TaxiNofifyServer+":"+config.TaxiNotifyServerPort);
socket.on('connect', function(){
    console.log("Connected to Notification Server with Id = " + socket.id);
});


var FCM = require('fcm-push');
var serverKey = 'AAAAz45E87Q:APA91bFlTSGlLaSqYUoSFIKl33P4hvGvzObss9ORAcKSP69rvnCvm4vmVbz9ZNBLf5s6lIOJiUh4BA5xZkHrIRovEJDcoObvTPH-ADa1YYGq5bl4lj09vSXj1uGQDmQU4Dd5ZrDLgYTr1SFuJqrV93d_b6UELn8zFA';
var fcm = new FCM(serverKey);


var exports = module.exports = {};



var UserStatus = require("../../Models/UserStatus");
var DriverStatus = require("../../Models/DriverStatus");
var TravelOrder = require("../../Models/TravelOrder");

function getTravelOrder(orderId){

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

exports.NotifyToUserViaFCM = function(userId,notifyData){

    UserStatus.findOne({User : userId}, function(error,user){

            if (user != null) {

                var message = {
                    to: user.FCMToken,
                    priority : "high",
                    data: notifyData
                };

                fcm.send(message,null);

            }
     });
}

exports.NotifyToDriverViaFCM = function(driverId,notifyData){

    DriverStatus.findOne({Driver : driverId}, function(error,driver){

            if (driver != null) {

                var message = {
                    to: driver.FCMToken,
                    priority : "high",
                    data: notifyData
                };

                fcm.send(message,null);

            }
     });
}

function NotifyViaSocket(eventName,notifyData){

    socket.emit(eventName, notifyData);

}

exports.isUserInForeground = function(userId){

    var deferred = Q.defer();

    socket.emit('CheckUserAppInForeground', { UserID: userId});

    setTimeout(function(){

        var url = config.TaxiNofifyServer+":"+config.TaxiNotifyServerPort + '/Socket/isUserInForeground?UserID=' + userId ;
        http.get(url, function(res) {
            res.on('data', function (bValue) {

              deferred.resolve(bValue == 1);

            });
        });

    }, 3000);

   return deferred.promise;
};

exports.isDriverInForeground = function(driverId){

    var deferred = Q.defer();

    socket.emit('CheckDriverAppInForeground', { DriverID: driverId});

    setTimeout(function(){

        var url =config.TaxiNofifyServer+":"+config.TaxiNotifyServerPort + '/Socket/isDriverInForeground?DriverID=' + driverId ;
        http.get(url, function(res) {
            res.on('data', function (bValue) {

              deferred.resolve(bValue == 1);

            });
        });

    }, 3000);

   return deferred.promise;
};

function NotifyToDriverAboutTripOrder(isSocketOnly, isFCMOnly, notifyType,order){

    if(isSocketOnly){
        NotifyViaSocket(notifyType, { DriverID: order.Driver, OrderID: order._id,  UserID: order.User });
        return;
    }

    if(isFCMOnly){

        var amount = null;

        if(order.OrderPrice != null && order.OrderPrice > 0 )
            amount = order.OrderPrice;

        if(order.ActPrice != null && order.ActPrice > 0 )
            amount = order.ActPrice;

        if(order.MustPay != null && order.MustPay > 0 )
            amount = order.MustPay;

        exports.NotifyToDriverViaFCM(order.Driver,{
            Type: notifyType,
            OrderID: order._id,
            UserID: order.User,
            DriverID: order.Driver,
            PickupPlace : order.OrderPickupPlace,
            Amount : amount

        });
        return;
    }


    Q.all([exports.isDriverInForeground(order.Driver),Q.resolve(notifyType),Q.resolve(order)])
    .spread(function(bValue,notifyType,order){

          if(bValue){

              NotifyViaSocket(notifyType, {  DriverID: order.Driver, OrderID: order._id,  UserID: order.User });

          }else{

              var amount = null;

              if(order.OrderPrice != null && order.OrderPrice > 0 )
                  amount = order.OrderPrice;

              if(order.ActPrice != null && order.ActPrice > 0 )
                  amount = order.ActPrice;

              if(order.MustPay != null && order.MustPay > 0 )
                  amount = order.MustPay;

              exports.NotifyToDriverViaFCM(order.Driver,{
                  Type: notifyType,
                  OrderID: order._id,
                  UserID: order.User,
                  DriverID: order.Driver,
                  PickupPlace : order.OrderPickupPlace,
                  Amount : amount
              });

          }

    });
}

function NotifyToUserAboutTripOrder(isSocketOnly, isFCMOnly, notifyType,order){

    if(isSocketOnly){
        NotifyViaSocket(notifyType, { DriverID: order.Driver, OrderID: order._id,  UserID: order.User });
        return;
    }

    if(isFCMOnly){

        var amount = null;

        if(order.OrderPrice != null && order.OrderPrice > 0 )
            amount = order.OrderPrice;

        if(order.ActPrice != null && order.ActPrice > 0 )
            amount = order.ActPrice;

        if(order.MustPay != null && order.MustPay > 0 )
            amount = order.MustPay;

        exports.NotifyToUserViaFCM(order.User,{
            Type: notifyType,
            OrderID: order._id,
            UserID: order.User,
            DriverID: order.Driver,
            PickupPlace : order.OrderPickupPlace,
            Amount : amount
        });
        return;
    }


    Q.all([exports.isUserInForeground(order.User),Q.resolve(notifyType),Q.resolve(order)])
    .spread(function(bValue,notifyType,order){

          if(bValue){

              NotifyViaSocket(notifyType, { DriverID: order.Driver, OrderID: order._id,  UserID: order.User });

          }else{

              var amount = null;

              if(order.OrderPrice != null && order.OrderPrice > 0 )
                  amount = order.OrderPrice;

              if(order.ActPrice != null && order.ActPrice > 0 )
                  amount = order.ActPrice;

              if(order.MustPay != null && order.MustPay > 0 )
                  amount = order.MustPay;

              exports.NotifyToUserViaFCM(order.User,{
                  Type: notifyType,
                  OrderID: order._id,
                  UserID: order.User,
                  DriverID: order.Driver,
                  PickupPlace : order.OrderPickupPlace,
                  Amount : amount
              });

          }

    });
}

exports.UserRequestTaxi = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToDriverAboutTripOrder(false,false,'UserRequestTaxi',order);
      });

};

exports.UserCancelRequest = function(order){

      if(order != null)
          NotifyToDriverAboutTripOrder(false,false,'UserCancelRequest',order);

};

exports.DriverBidding = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToUserAboutTripOrder(false,false,'DriverBidding',order);
      });

};

exports.UserAcceptBidding = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToDriverAboutTripOrder(false,false,'UserAcceptBidding',order);
      });

};

exports.UserCancelAcceptingBidding = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToUserAboutTripOrder(false,false,'UserCancelAcceptingBidding',order);
      });

};

exports.DriverAccepted = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToUserAboutTripOrder(false,false,'DriverAccepted',order);
      });

};

exports.DriverRejected = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToUserAboutTripOrder(false,false,'DriverRejected',order);
      });

};

exports.DriverVoidedBfPickup = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToUserAboutTripOrder(false,false,'DriverVoidedBfPickup',order);
      });

};

exports.UserVoidedBfPickup = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToDriverAboutTripOrder(false,false,'UserVoidedBfPickup',order);
      });

};

exports.DriverStartPicking = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToUserAboutTripOrder(false,false,'DriverStartPicking',order);
      });

};

exports.DriverAtPickupPlace = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToUserAboutTripOrder(false,false,'DriverAtPickupPlace',order);
      });

};

exports.UserGotThePickupNotice = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToDriverAboutTripOrder(false,false,'UserGotThePickupNotice',order);
      });

};

exports.DriverStartedTrip = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToUserAboutTripOrder(false,false,'DriverStartedTrip',order);
      });

};

exports.DriverVoidedAfPickup = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToUserAboutTripOrder(false,false,'DriverVoidedAfPickup',order);
      });

};

exports.UserVoidedAfPickup = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToDriverAboutTripOrder(false,false,'UserVoidedAfPickup',order);
      });

};

exports.DriverFinished = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToUserAboutTripOrder(false,false,'DriverFinished',order);
      });

};

exports.DriverReceivedCash = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToUserAboutTripOrder(false,false,'DriverReceivedCash',order);
      });

};

exports.UserPaidByCard = function(orderId){

      getTravelOrder(orderId).then(function(order){

            if(order != null)
                NotifyToDriverAboutTripOrder(false,false,'UserPaidByCard',order);
      });

};

exports.UserShouldInvalidateOrder = function(userId,orderId){

      Q.all([getTravelOrder(orderId),Q.resolve(userId)])
      .spread(function(order,userId){

            if(order != null)
                NotifyViaSocket('UserShouldInvalidateOrder', { DriverID: order.Driver, OrderID: order._id,  UserID:  userId });

      });

};

exports.DriverShouldInvalidateOrder = function(driverId,orderId){

      Q.all([getTravelOrder(orderId),Q.resolve(driverId)])
      .spread(function(order,userId){

            if(order != null)
                NotifyViaSocket('DriverShouldInvalidateOrder', { DriverID: driverId, OrderID: order._id,  UserID:  order.User });

      });

};



exports.MateMemberSentRequest = function(orderId,hostId){

      Q.all([getTravelOrder(orderId),getTravelOrder(hostId)])
      .spread(function(order,host){

            if(order != null && host != null){

                  Q.all([exports.isUserInForeground(host.User),Q.resolve(order),Q.resolve(host)])
                  .spread(function(bValue,order,host){

                      //  if(bValue){

                            NotifyViaSocket("MateMemberSentRequest", { UserID: host.User, OrderID: host._id });

                    //    }else{

                            var amount = null;

                            if(order.OrderPrice != null && order.OrderPrice > 0 )
                                amount = order.OrderPrice;

                            if(order.MateOrderPrice != null && order.MateOrderPrice > 0 )
                                amount = order.MateOrderPrice;

                            exports.NotifyToUserViaFCM(host.User,{
                                Type: "MateMemberSentRequest",
                                OrderID: host._id,
                                UserID: order.User,
                                PickupPlace : order.OrderPickupPlace,
                                Amount : amount
                            });

                    //    }

                  });

            }
      });

};

exports.HostAcceptMateMember = function(orderId,hostId){

      Q.all([getTravelOrder(orderId),getTravelOrder(hostId)])
      .spread(function(order,host){

            if(order != null && host != null){

                  Q.all([exports.isUserInForeground(order.User),Q.resolve(order),Q.resolve(host)])
                  .spread(function(bValue,order,host){

                      //  if(bValue){

                            NotifyViaSocket("HostAcceptMateMember", { OrderUserID: order.User, OrderID: order._id, HostID: host._id,  HostUserID: host.User });

                      //  }else{

                            var amount = null;

                            if(order.OrderPrice != null && order.OrderPrice > 0 )
                                amount = order.OrderPrice;

                            if(order.MateOrderPrice != null && order.MateOrderPrice > 0 )
                                amount = order.MateOrderPrice;

                            exports.NotifyToUserViaFCM(order.User,{
                                Type: "HostAcceptMateMember",
                                OrderID: order._id,
                                OrderUserID: order.User,
                                HostID: host._id,
                                HostUserID: host.User,
                                PickupPlace : order.OrderPickupPlace,
                                Amount : amount
                            });

                    //    }

                  });

            }
      });

};

exports.HostRejectMateMember = function(orderId,hostId){

      Q.all([getTravelOrder(orderId),getTravelOrder(hostId)])
      .spread(function(order,host){

            if(order != null && host != null){

                  Q.all([exports.isUserInForeground(order.User),Q.resolve(order),Q.resolve(host)])
                  .spread(function(bValue,order,host){

                      //  if(bValue){

                            NotifyViaSocket("HostRejectMateMember", { OrderUserID: order.User, OrderID: order._id, HostID: host._id,  HostUserID: host.User });

                      //  }else{

                            var amount = null;

                            if(order.OrderPrice != null && order.OrderPrice > 0 )
                                amount = order.OrderPrice;

                            if(order.MateOrderPrice != null && order.MateOrderPrice > 0 )
                                amount = order.MateOrderPrice;

                            exports.NotifyToUserViaFCM(order.User,{
                                Type: "HostRejectMateMember",
                                OrderID: order._id,
                                OrderUserID: order.User,
                                HostID: host._id,
                                HostUserID: host.User,
                                PickupPlace : order.OrderPickupPlace,
                                Amount : amount
                            });

                    //    }

                  });

            }
      });

};

exports.MemberLeaveFromTripMate = function(orderId,hostId){

      Q.all([getTravelOrder(orderId),getTravelOrder(hostId)])
      .spread(function(order,host){

            if(order != null && host != null){

                  Q.all([exports.isUserInForeground(host.User),Q.resolve(order),Q.resolve(host)])
                  .spread(function(bValue,order,host){

                      //  if(bValue){

                            NotifyViaSocket("MemberLeaveFromTripMate", { UserID: host.User, OrderID: host._id });

                      //  }else{

                            var amount = null;

                            if(order.OrderPrice != null && order.OrderPrice > 0 )
                                amount = order.OrderPrice;

                            if(order.MateOrderPrice != null && order.MateOrderPrice > 0 )
                                amount = order.MateOrderPrice;

                            exports.NotifyToUserViaFCM(host.User,{
                                Type: "MemberLeaveFromTripMate",
                                OrderID: host._id,
                                UserID: order.User,
                                PickupPlace : order.OrderPickupPlace,
                                Amount : amount
                            });

                    //    }

                  });

            }
      });

};

exports.HostCloseTripMate = function(orderId,hostId){

      Q.all([getTravelOrder(orderId),getTravelOrder(hostId)])
      .spread(function(order,host){

            if(order != null && host != null){

                  Q.all([exports.isUserInForeground(order.User),Q.resolve(order),Q.resolve(host)])
                  .spread(function(bValue,order,host){

                      //  if(bValue){

                            NotifyViaSocket("HostCloseTripMate", { OrderUserID: order.User, OrderID: order._id, HostID: host._id,  HostUserID: host.User });

                      //  }else{

                            var amount = null;

                            if(order.OrderPrice != null && order.OrderPrice > 0 )
                                amount = order.OrderPrice;

                            if(order.MateOrderPrice != null && order.MateOrderPrice > 0 )
                                amount = order.MateOrderPrice;

                            exports.NotifyToUserViaFCM(order.User,{
                                Type: "HostCloseTripMate",
                                OrderID: order._id,
                                OrderUserID: order.User,
                                HostID: host._id,
                                HostUserID: host.User,
                                PickupPlace : order.OrderPickupPlace,
                                Amount : amount
                            });

                    //    }

                  });

            }
      });

};

exports.HostVoidTripMate = function(orderId,hostId){

      Q.all([getTravelOrder(orderId),getTravelOrder(hostId)])
      .spread(function(order,host){

            if(order != null && host != null){

                  Q.all([exports.isUserInForeground(order.User),Q.resolve(order),Q.resolve(host)])
                  .spread(function(bValue,order,host){

                      //  if(bValue){

                            NotifyViaSocket("HostVoidTripMate", { OrderUserID: order.User, OrderID: order._id, HostID: host._id,  HostUserID: host.User });

                      //  }else{

                            var amount = null;

                            if(order.OrderPrice != null && order.OrderPrice > 0 )
                                amount = order.OrderPrice;

                            if(order.MateOrderPrice != null && order.MateOrderPrice > 0 )
                                amount = order.MateOrderPrice;

                            exports.NotifyToUserViaFCM(order.User,{
                                Type: "HostVoidTripMate",
                                OrderID: order._id,
                                OrderUserID: order.User,
                                HostID: host._id,
                                HostUserID: host.User,
                                PickupPlace : order.OrderPickupPlace,
                                Amount : amount
                            });

                    //    }

                  });

            }
      });

};



exports.DriverVoidTripMate = function(orderId,hostId){

      Q.all([getTravelOrder(orderId),getTravelOrder(hostId)])
      .spread(function(order,host){

            if(order != null && host != null){

                  Q.all([exports.isUserInForeground(order.User),Q.resolve(order),Q.resolve(host)])
                  .spread(function(bValue,order,host){

                      //  if(bValue){

                            NotifyViaSocket("DriverVoidTripMate", { OrderUserID: order.User, OrderID: order._id, HostID: host._id,  HostUserID: host.User });

                      //  }else{

                            var amount = null;

                            if(order.OrderPrice != null && order.OrderPrice > 0 )
                                amount = order.OrderPrice;

                            if(order.MateOrderPrice != null && order.MateOrderPrice > 0 )
                                amount = order.MateOrderPrice;

                            exports.NotifyToUserViaFCM(order.User,{
                                Type: "DriverVoidTripMate",
                                OrderID: order._id,
                                OrderUserID: order.User,
                                HostID: host._id,
                                HostUserID: host.User,
                                PickupPlace : order.OrderPickupPlace,
                                Amount : amount
                            });

                    //    }

                  });

            }
      });

};

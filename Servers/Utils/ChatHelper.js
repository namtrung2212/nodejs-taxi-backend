
var config= require ("./ServerConfig");
var Q = require('q');

var socket = require('socket.io-client')(config.ChatServer+":"+config.ChatServerPort);
socket.on('connect', function(){
    console.log("Connected to Chat Server with Id = " + socket.id);
});


var NotificationHelper = require('./NotificationHelper');
var TravelOrderHelper = require('./TravelOrderHelper');
var MongoDBHelper = require("../../BaseApps/MongoDBHelper");
var TravelOrder = require("../../Models/TravelOrder");


var exports = module.exports = {};

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

exports.UserChatToDriver = function(req){

    var deferred = Q.defer();

    MongoDBHelper.createObject("TravelOrderChatting",req, null).then(function(chatObj){

          if(chatObj != null && ( typeof chatObj.error === "undefined")){

                Q.all([getTravelOrder(chatObj.Order),  NotificationHelper.isDriverInForeground(chatObj.Driver),Q.resolve(chatObj)])
                .spread(function(order,bValue,chatObj){

                      socket.emit("UserChatToDriver",  {  DriverID: chatObj.Driver, OrderID: chatObj.Order,  UserID: chatObj.User,  ContentID: chatObj._id,  Content: chatObj.Content });

                      if(!bValue){

                            NotificationHelper.NotifyToDriverViaFCM(chatObj.Driver,{
                              Type: "UserChatToDriver",
                              OrderID: chatObj.Order,
                              UserID: chatObj.User,
                              UserName: chatObj.UserName,
                              Message: chatObj.Content,
                              PickupPlace : order.OrderPickupPlace
                          });

                      }

                });

                deferred.resolve(chatObj);

          }else{

              deferred.resolve(null);
          }


    });

    return deferred.promise;


};

exports.DriverChatToUser = function(req){

    var deferred = Q.defer();

    MongoDBHelper.createObject("TravelOrderChatting",req, null).then(function(chatObj){

          if(chatObj != null && ( typeof chatObj.error === "undefined")){

                Q.all([getTravelOrder(chatObj.Order), NotificationHelper.isUserInForeground(chatObj.User),Q.resolve(chatObj)])
                .spread(function(order,bValue,chatObj){

                      socket.emit("DriverChatToUser",  {  DriverID: chatObj.Driver, OrderID: chatObj.Order,  UserID: chatObj.User,  ContentID: chatObj._id,  Content: chatObj.Content });

                      if(!bValue){

                          NotificationHelper.NotifyToUserViaFCM(chatObj.User,{
                              Type: "DriverChatToUser",
                              OrderID: chatObj.Order,
                              DriverID: chatObj.Driver,
                              DriverName: chatObj.DriverName,
                              Message: chatObj.Content,
                              PickupPlace : order.OrderPickupPlace
                          });

                      }

                });

                deferred.resolve(chatObj);

          }else{

              deferred.resolve(null);
          }

    });

    return deferred.promise;

};


exports.UserChatToGroup = function(req){

    var deferred = Q.defer();

      MongoDBHelper.createObject("TripMateChatting",req, null).then(function(chatObj){

            if(chatObj != null && ( typeof chatObj.error === "undefined")){

                  getTravelOrder(chatObj.UserOrder).then(function(order){

                          Q.all([getTravelOrder(order.MateHostOrder),Q.resolve(order),TravelOrderHelper.GetMateSubOrdersByHostId(order._id),Q.resolve(chatObj)])
                          .spread(function(host,order,orders,chatObj){

                                  orders.push(host);

                                  for (var i = 0; i < orders.length; i++)
                                      if(orders[i]._id != order._id){

                                              Q.all([NotificationHelper.isUserInForeground(orders[i].User),Q.resolve(orders[i]),Q.resolve(chatObj)])
                                              .spread(function(bValue,memberOrder,chatObj){

                                                    socket.emit("UserChatToGroup",  { OrderID: memberOrder._id,  UserID: memberOrder.User,  ContentID: chatObj._id,  Content: chatObj.Content });

                                                    if(!bValue){

                                                        NotificationHelper.NotifyToUserViaFCM(memberOrder.User,{
                                                            Type: "UserChatToGroup",
                                                            OrderID: memberOrder._id,
                                                            UserName: chatObj.UserName,
                                                            Message: chatObj.Content,
                                                            PickupPlace : memberOrder.OrderPickupPlace
                                                        });

                                                    }
                                              });
                                      }
                          });

                  });

                  deferred.resolve(chatObj);

            }else{

                deferred.resolve(null);
            }

      });

      return deferred.promise;



};

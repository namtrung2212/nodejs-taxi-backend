
app=require("../../../Base/BaseCalcApp")("User");


var UserPosHistory = require("../Models/UserPosHistory");
var UserStatus = require("../Models/TravelOrder");

refreshUserStatusStatistic();

setInterval(function() {

    if( new Date().getHours() == 21 && new Date().getMinutes() < 10)// 4 gio dem VN
        refreshUserStatusStatistic();

}, 1000*60*10);


module.exports = app;


function refreshUserStatusStatistic(){

          console.log("refresh UserStatus Statistic");

          TravelOrder.aggregate()
                      .match({ $or: [
                                        { Status : "Finished"},
                                        { Status : "VoidedBfPickupByUser"},
                                        { Status : "VoidedBfPickupByDriver"},
                                        { Status : "VoidedAfPickupByUser"},
                                        { Status : "VoidedAfPickupByDriver"}
                                      ]})
                      .group({
                              _id  : "$User",
                              ServedQty: {$sum: 1},

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
                                                }}
                            })
                      .exec(function (err, data) {

                          data.forEach(function(obj){

                                UserStatus.findOneAndUpdate( {_id: obj._id},
                                                          {
                                                              ServedQty:obj.ServedQty,
                                                              VoidedAfPickupByDriver:obj.VoidedAfPickupByDriver,
                                                              VoidedAfPickupByUser:obj.VoidedAfPickupByUser,
                                                              VoidedBfPickupByDriver:obj.VoidedBfPickupByDriver,
                                                              VoidedBfPickupByUser:obj.VoidedBfPickupByUser
                                                          },function(err,raw){

                                                          });
                          })
                      })
}

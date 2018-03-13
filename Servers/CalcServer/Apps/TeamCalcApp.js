
app=require("../../../Base/BaseCalcApp")("Team");


var Team = require("../Models/Team");
var TravelOrder = require("../Models/TravelOrder");


refreshTeamStatistic();

setInterval(function() {

    if( new Date().getHours() == 18 && new Date().getMinutes() < 10) // 1 gio dem VN
        refreshTeamStatistic();

}, 1000*60*10);



module.exports = app;

function refreshTeamStatistic(){

          console.log("refresh Team Statistic");

          TravelOrder.aggregate()
                      .match({ $or: [
                                        { Status : "Finished"},
                                        { Status : "VoidedBfPickupByUser"},
                                        { Status : "VoidedBfPickupByDriver"},
                                        { Status : "VoidedAfPickupByUser"},
                                        { Status : "VoidedAfPickupByDriver"}
                                      ]})
                      .group({
                              _id  : "$Team",
                              ServedQty: {$sum: 1},
                              RateCount: {$sum: {
                                                $cond:[{ $gt: ["$Rating",0]},
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

                             VoidedBfPickupByDriver : {$sum: {
                                                   $cond:[
                                                             {$or:  [
                                                                        {$eq: ["$Status","VoidedBfPickupByDriver"]}
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

                             VoidedBfPickupByUser : {$sum: {
                                                   $cond:[
                                                             {$or:  [
                                                                        {$eq: ["$Status","VoidedBfPickupByUser"]}
                                                             ]},
                                                              1,
                                                              0
                                                   ]
                                              }},

                                RatingSum: {$sum: "$Rating"}
                            })
                      .exec(function (err, data) {

                          data.forEach(function(obj){

                                Team.findOneAndUpdate( {_id: obj._id},
                                                          {
                                                              ServedQty:obj.ServedQty,
                                                              RateCount:obj.RateCount,
                                                              Rating:Math.ceil(obj.RatingSum/obj.RateCount),
                                                              VoidedBfPickupByDriver:obj.VoidedBfPickupByDriver,
                                                              VoidedBfPickupByUser:obj.VoidedBfPickupByUser,
                                                              VoidedAfPickupByDriver:obj.VoidedAfPickupByDriver,
                                                              VoidedAfPickupByUser:obj.VoidedAfPickupByUser
                                                          },function(err,raw){

                                                          });
                          })
                      });
}

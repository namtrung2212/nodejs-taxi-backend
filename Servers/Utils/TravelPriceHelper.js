
var Q = require('q');
var redis = require('redis');
var config =require('../GlobalConfig');
var client = redis.createClient(config.RedisPort,config.RedisServer);

var Driver     =   require("../../Models/Driver");
var DriverStatus     =   require("../../Models/DriverStatus");
var UserStatus     =   require("../../Models/UserStatus");
var Vehicle     =   require("../../Models/Vehicle");
var WorkingPlan     =   require("../../Models/WorkingPlan");
var TravelOrder     =   require("../../Models/TravelOrder");
var TravelComPrice     =   require("../../Models/TravelComPrice");
var TravelComPriceAdjust     =   require("../../Models/TravelComPriceAdjust");
var TravelComPromotion     =   require("../../Models/TravelComPromotion");
var TravelPriceAverage = require("../../Models/TravelPriceAverage");
var TravelSysPromotion     =   require("../../Models/TravelSysPromotion");


var DriverHelper = require('./DriverHelper');
var DriverWorkingPlanHelper = require('./DriverWorkingPlanHelper');
var UserHelper = require('./UserHelper');
var TravelOrderHelper = require('./TravelOrderHelper');

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

exports.CalculateAverageTripPrice = function(params){

    var deferred = Q.defer();

    Q.all([UserHelper.getUserStatusByUserId(params.UserId),Q.resolve(params)])
    .spread(function (userStatus, params) {

            if(userStatus == null){
                console.log("userStatus is null");
                deferred.resolve(null);
                return;
            }

            var promoteParams = {

                PickupLoc : params.PickupLoc,
                Country :   params.Country,
                Currency :   params.Currency,
                VehicleType :   params.VehicleType,
                QualityService :   params.QualityService,
                UserServedQty : userStatus.ServedQty,
                OrderPickupTime : params.OrderPickupTime != null ? params.OrderPickupTime : new Date()

            };

            var avgComParams = {

                PickupLoc : params.PickupLoc,
                Country :   params.Country,
                Currency :   params.Currency,
                VehicleType :   params.VehicleType,
                QualityService :   params.QualityService,
                OrderPickupTime : params.OrderPickupTime != null ? params.OrderPickupTime : new Date()

            };

            Q.all([getAverageCompanyPrices(avgComParams),getSystemPromotions(promoteParams),Q.resolve(params)])
            .spread(function(prices,syspromotions,params){

                    var distance = params.Distance / 1000; // => convert to Kilometers

                    var companyPriceAmt = getCompanyPriceAmount(prices,0,distance);
                    if(params.Currency == "VND")
                       companyPriceAmt = Math.round(companyPriceAmt/1000) * 1000;

                    var systemPromotionAmt = getSystemPromotionAmount(distance,prices,syspromotions);
                    if(params.Currency == "VND")
                       systemPromotionAmt = Math.round(systemPromotionAmt/1000) * 1000;

                    var finalprice = companyPriceAmt  - systemPromotionAmt;

                    var result = {
                         companyPriceAmt : companyPriceAmt,
                         systemPromotionAmt : systemPromotionAmt,
                         finalprice : finalprice
                    };
                    deferred.resolve(JSON.stringify(result));

            });

    });

    return deferred.promise;
}

exports.TryToCalculateTripPrice = function(orderId,driverId){

      var deferred = Q.defer();

      Q.all([getTravelOrder(orderId),DriverHelper.getDriver(driverId)])
       .spread(function (order, driver){

             var distance = order.OrderDistance;
             if((order.ActPickupLoc != null && order.ActPickupLoc.length == 2) &&  (order.ActDropLoc != null && order.ActDropLoc.length == 2)){
                distance = ActDistance;
             }else{
                  if(order.IsMateHost == 0)
                      distance = order.OrderDistance;
                  else
                      distance = order.HostOrderDistance;
             }

             var params = {

                 DriverId : driver._id,
                 UserId :   order.User,
                 Currency :   order.Currency,
                 Distance :   distance,
                 PickupLoc :   order.OrderPickupLoc,
                 OrderPickupTime :  order.OrderPickupTime == null ? order.createdAt : order.OrderPickupTime

             };

             Q.all([exports.CalculateTripPrice(params), Q.resolve(order), Q.resolve(driver)])
              .spread(function (data, order,driver){

                          if(data != null){
                              data = JSON.parse(data);
                              data.DriverId = driver._id;
                              data.OrderId = order._id;
                              data.CompanyPrice = parseFloat(data.companyPriceAmt);
                              data.CompanyAdjust = parseFloat(data.companyAdjustAmt);
                              data.CompanyProm = parseFloat(data.companyPromotionAmt);
                              data.SysProm = parseFloat(data.systemPromotionAmt);
                              data.FinalPrice = parseFloat(data.finalprice);
                          }
                         deferred.resolve(data);

             });

        });


      return deferred.promise;
};

exports.CalculateTripPrice = function(params){

      var deferred = Q.defer();

      var cacheKey = JSON.stringify(params);
      client.get(cacheKey, function(err, reply) {

          if(reply){

                  deferred.resolve(reply);

          }else {

                Q.all([DriverHelper.getDriver(params.DriverId).then(DriverWorkingPlanHelper.getDriverWorkingPlanByDriver),
                       UserHelper.getUserStatusByUserId(params.UserId),
                       Q.resolve(params)])
                 .spread(function (workingPlan, userStatus,params){

                          if(workingPlan == null){
                              console.log("workingPlan is null");
                              deferred.resolve(null);
                              return;
                          }

                          if(userStatus == null){
                              console.log("userStatus is null");
                              deferred.resolve(null);
                              return;
                          }

                          var newParams = {

                              PickupLoc : params.PickupLoc,
                              Country :   workingPlan.Country,
                              Company :   workingPlan.Company,
                              Team :   workingPlan.Team,
                              Currency :   params.Currency,
                              VehicleType :   workingPlan.VehicleType,
                              QualityService :   workingPlan.QualityService,
                              UserServedQty : userStatus.ServedQty,
                              OrderPickupTime :  params.OrderPickupTime

                          };


                          Q.all([getCompanyPrices(newParams),
                                 getCompanyPriceAdjusts(newParams),
                                 getCompanyPromotions(newParams),
                                 getSystemPromotions(newParams),
                                 Q.resolve(params)])
                           .spread(function (prices, adjusts,compromotions,syspromotions,params){

                                 var distance = params.Distance / 1000; // => convert to Kilometers

                                 var companyPriceAmt = getCompanyPriceAmount(prices,0,distance);
                                 if(params.Currency == "VND")
                                    companyPriceAmt = Math.round(companyPriceAmt/1000) * 1000;

                                 var companyAdjustAmt = getCompanyAdjustAmount(distance,prices,adjusts);
                                 if(params.Currency == "VND")
                                    companyAdjustAmt = Math.round(companyAdjustAmt/1000) * 1000;

                                 var companyPromotionAmt = getCompanyPromotionAmount(distance,prices,compromotions);
                                 if(params.Currency == "VND")
                                    companyPromotionAmt = Math.round(companyPromotionAmt/1000) * 1000;

                                 var systemPromotionAmt = getSystemPromotionAmount(distance,prices,syspromotions);

                                 if(params.Currency == "VND")
                                    systemPromotionAmt = Math.round(systemPromotionAmt/1000) * 1000;

                                 var finalprice = companyPriceAmt + companyAdjustAmt - companyPromotionAmt - systemPromotionAmt;

                                 var result = {
                                      companyPriceAmt : companyPriceAmt,
                                      companyAdjustAmt : companyAdjustAmt,
                                      companyPromotionAmt : companyPromotionAmt,
                                      systemPromotionAmt : systemPromotionAmt,
                                      finalprice : finalprice
                                 };

                                  var cacheKey = JSON.stringify(params);
                                  client.set(cacheKey, JSON.stringify(result));
                                      client.expire(cacheKey, 60*60); // 1 hour

                                  deferred.resolve(JSON.stringify(result));

                           });

                  });

          }
      });



      return deferred.promise;
};

function getAverageUnitPrice(country,currency,vehicleType,qualityService){

    var deferred = Q.defer();

    TravelPriceAverage.findOne({Country : country , Currency : currency,VehicleType : vehicleType, QualityService: qualityService },function(err,price){

              if(err || price == null){

                    TravelPriceAverage.findOne({Country : country , Currency : currency,VehicleType : vehicleType },function(err,price){

                              if(err || price == null){

                                      TravelPriceAverage.findOne({Country : country , Currency : currency },function(err,price){
                                            deferred.resolve(price);
                                      });

                              }else{
                                  deferred.resolve(price);
                              }
                    });

              }else{
                  deferred.resolve(price);
              }
    });

    return deferred.promise;
}


function getAverageCompanyPrices(params){

  var deferred = Q.defer();

  var queryBuilder = TravelComPrice.aggregate(
                {
                  $geoNear: {
                       near: params.PickupLoc,
                       maxDistance: "$PickupRadian",
                       distanceField : "distance",
                       query : {
                                 Country: params.Country ,
                                 IsEnable: 1 ,
                                 IsActive: 1 ,
                                 Currency: params.Currency ,
                                 EffectDateFrom: { $lte: params.OrderPickupTime} ,
                                  $or : [
                                             {EffectDateTo : null},
                                             {EffectDateTo : { $gte : params.OrderPickupTime}}
                                         ],
                                 TimeInDayFrom: { $lte: params.OrderPickupTime.getHours() } ,
                                 TimeInDayTo: { $gt: params.OrderPickupTime.getHours()}
                              }
                  }
                }
              );

               if(params.VehicleType != null)
                   queryBuilder = queryBuilder.match({  VehicleType : { $in : [null,params.VehicleType] }});

               if(params.QualityService != null)
                   queryBuilder = queryBuilder.match({  QualityService : { $in : [null,params.QualityService] }});

              queryBuilder.sort({"FromKm": -1})
              .group({
                      _id  : {
                                Country : "$Country",
                                FromKm : "$FromKm"
                             },
                      FromKm : {$first :"$FromKm"},
                      PricePerKm : {$avg :"$PricePerKm"},
                      OpenningPrice : {$avg :"$OpenningPrice"}
                    })
              .exec( function(error,result){

                         if (error) {
                           console.log(error);
                             deferred.reject(new Error(error));
                         }
                         else {
                           deferred.resolve(result);
                         }
               });

  return deferred.promise;
}



function getCompanyPrices(params){

  var deferred = Q.defer();
  var queryBuilder = TravelComPrice.aggregate(
              {
                $geoNear: {
                     near: params.PickupLoc,
                     maxDistance: "$PickupRadian",
                     distanceField : "distance",
                     query : {
                               Country: params.Country ,
                               Company: params.Company ,
                               IsEnable: 1 ,
                               IsActive: 1 ,
                               Currency: params.Currency ,
                               EffectDateFrom: { $lte: params.OrderPickupTime} ,
                                $or : [
                                           {EffectDateTo : null},
                                           {EffectDateTo : { $gte : params.OrderPickupTime}}
                                       ],
                               TimeInDayFrom: { $lte: params.OrderPickupTime.getHours() } ,
                               TimeInDayTo: { $gt: params.OrderPickupTime.getHours() }
                            }
                }
              }
            );

             if(params.Team != null)
                 queryBuilder = queryBuilder.match({  Team : { $in : [null,params.Team] }});

             if(params.VehicleType != null)
                 queryBuilder = queryBuilder.match({  VehicleType : { $in : [null,params.VehicleType] }});

             if(params.QualityService != null)
                 queryBuilder = queryBuilder.match({  QualityService : { $in : [null,params.QualityService] }});


              queryBuilder.sort({"FromKm": -1})
              .group({
                      _id  : {
                                Country : "$Country",
                                Company : "$Company",
                                Team : "$Team",
                                VehicleType : "$VehicleType",
                                QualityService : "$QualityService",
                                PickupCenterLoc : "$PickupCenterLoc",
                                PickupRadian : "$PickupRadian",
                                FromKm : "$FromKm"
                             },
                      TravelComPriceId: {$first :"$_id"},
                      FromKm : {$first :"$FromKm"},
                      PricePerKm : {$first :"$PricePerKm"},
                      OpenningPrice : {$first :"$OpenningPrice"}
                    })
              .exec( function(error,result){

                         if (error) {
                           console.log(error);
                             deferred.reject(new Error(error));
                         }
                         else {
                           deferred.resolve(result);
                         }
               });

  return deferred.promise;
}

function getCompanyPriceAdjusts(params){

  var deferred = Q.defer();
    var queryBuilder = TravelComPriceAdjust.aggregate(
              {
                $geoNear: {
                     near: params.PickupLoc,
                     maxDistance: "$PickupRadian",
                     distanceField : "distance",
                     query : {
                               Country: params.Country ,
                               Company: params.Company ,
                               IsEnable: 1 ,
                               IsActive: 1 ,
                               Currency: params.Currency ,
                               EffectDateFrom: { $lte: params.OrderPickupTime} ,
                                $or : [
                                           {EffectDateTo : null},
                                           {EffectDateTo : { $gte : params.OrderPickupTime}}
                                       ],
                               TimeInDayFrom: { $lte: params.OrderPickupTime.getHours() } ,
                               TimeInDayTo: { $gt: params.OrderPickupTime.getHours() }
                            }
                }
              });

               if(params.Team != null)
                   queryBuilder = queryBuilder.match({  Team : { $in : [null,params.Team] }});

               if(params.VehicleType != null)
                   queryBuilder = queryBuilder.match({  VehicleType : { $in : [null,params.VehicleType] }});

               if(params.QualityService != null)
                   queryBuilder = queryBuilder.match({  QualityService : { $in : [null,params.QualityService] }});


              queryBuilder.sort({"FromKm": -1})
              .group({
                      _id  : {
                                Country : "$Country",
                                Company : "$Company",
                                Team : "$Team",
                                VehicleType : "$VehicleType",
                                QualityService : "$QualityService",
                                PickupCenterLoc : "$PickupCenterLoc",
                                PickupRadian : "$PickupRadian",
                                FromKm : "$FromKm"
                             },
                      TravelComAdjustId: {$first :"$_id"},
                      FromKm : {$first :"$FromKm"},
                      FixedAdjustPerKm : {$first :"$FixedAdjustPerKm"},
                      AdjustPct : {$first :"$AdjustPct"}
                    })
              .exec( function(error,result){

                         if (error) {
                           console.log(error);
                             deferred.reject(new Error(error));
                         }
                         else {
                           deferred.resolve(result);
                         }
               });

  return deferred.promise;
}

function getCompanyPromotions(params){

  var deferred = Q.defer();
  var queryBuilder = TravelComPromotion.aggregate(
              {
                $geoNear: {
                     near: params.PickupLoc,
                     maxDistance: "$PickupRadian",
                     distanceField : "distance",
                     query : {
                               Country: params.Country ,
                               Company: params.Company ,
                               IsEnable: 1 ,
                               IsActive: 1 ,
                               Currency: params.Currency ,
                               EffectDateFrom: { $lte: params.OrderPickupTime} ,
                                $or : [
                                           {EffectDateTo : null},
                                           {EffectDateTo : { $gte : params.OrderPickupTime}}
                                       ],
                               TimeInDayFrom: { $lte: params.OrderPickupTime.getHours() } ,
                               TimeInDayTo: { $gt: params.OrderPickupTime.getHours() },
                               MinServedQty: { $lte: params.UserServedQty },
                               MaxServedQty: { $gte: params.UserServedQty }
                            }
                }
              });

               if(params.Team != null)
                   queryBuilder = queryBuilder.match({  Team : { $in : [null,params.Team] }});

               if(params.VehicleType != null)
                   queryBuilder = queryBuilder.match({  VehicleType : { $in : [null,params.VehicleType] }});

               if(params.QualityService != null)
                   queryBuilder = queryBuilder.match({  QualityService : { $in : [null,params.QualityService] }});


              queryBuilder.sort({"FromKm": -1})
              .group({
                      _id  : {
                                Country : "$Country",
                                Company : "$Company",
                                Team : "$Team",
                                VehicleType : "$VehicleType",
                                QualityService : "$QualityService",
                                PickupCenterLoc : "$PickupCenterLoc",
                                PickupRadian : "$PickupRadian",
                                FromKm : "$FromKm"
                             },
                      TravelComAdjustId: {$first :"$_id"},
                      FromKm : {$first :"$FromKm"},
                      FixedAmtPerKm : {$first :"$FixedAmtPerKm"},
                      PromotePct : {$first :"$PromotePct"}
                    })
              .exec( function(error,result){

                         if (error) {
                           console.log(error);
                             deferred.reject(new Error(error));
                         }
                         else {
                           deferred.resolve(result);
                         }
               });

  return deferred.promise;
}

function getCompanyPriceAmount(prices,fromKM, toKM){

       var amount = 0;
       var lastValue = 0;
       for(var i = 0; i < prices.length;i++){

           var price = prices[i];
           if(price.FromKm <= toKM){

             if(lastValue == 0)
                amount  += ((price.PricePerKm * (toKM - price.FromKm)) + price.OpenningPrice);
             else if(fromKM <= price.FromKm)
                amount  += ((price.PricePerKm * (lastValue - price.FromKm))  + price.OpenningPrice);
             else
                amount  += ((price.PricePerKm * (lastValue - fromKM))  + price.OpenningPrice);

            lastValue = price.FromKm;
           }


       }

  return amount;

}

function getCompanyAdjustAmount(distance,prices,adjusts){

       var adjustAmount = 0;
       var lastValue = 0;
       for(var j = 0; j < adjusts.length;j++){

         var adjust = adjusts[j];

         if(j == 0){

              adjustAmount += (adjust.FixedAdjustPerKm * (distance - adjust.FromKm));
              adjustAmount += (adjust.AdjustPct / 100 * getCompanyPriceAmount(prices,adjust.FromKm,distance));

          }else{

              adjustAmount += (adjust.FixedAdjustPerKm * (lastValue - adjust.FromKm));
              adjustAmount += (adjust.AdjustPct / 100 * getCompanyPriceAmount(prices,adjust.FromKm,lastValue));
          }

          lastValue = adjust.FromKm;
       }

       return adjustAmount;
}

function getCompanyPromotionAmount(distance,prices,promotions){

       var promoteAmount = 0;
       var lastValue = 0;
       for(var j = 0; j < promotions.length;j++){

         var promote = promotions[j];

         if(j == 0){

              promoteAmount += (promote.FixedAmtPerKm * (distance - promote.FromKm));
              promoteAmount += (promote.PromotePct / 100 * getCompanyPriceAmount(prices,promote.FromKm,distance));

          }else{

              promoteAmount += (promote.FixedAmtPerKm * (lastValue - promote.FromKm));
              promoteAmount += (promote.PromotePct / 100 * getCompanyPriceAmount(prices,promote.FromKm,lastValue));
          }

          lastValue = promote.FromKm;
       }

       return promoteAmount;
}

function getSystemPromotions(params){

  var deferred = Q.defer();

  var queryBuilder = TravelSysPromotion.aggregate(
              {
                $geoNear: {
                     near: params.PickupLoc,
                     maxDistance: "$PickupRadian",
                     distanceField : "distance",
                     query : {
                               Country: params.Country ,
                               IsEnable: 1 ,
                               IsActive: 1 ,
                               Currency: params.Currency ,
                               EffectDateFrom: { $lte: params.OrderPickupTime} ,
                                $or : [
                                           {EffectDateTo : null},
                                           {EffectDateTo : { $gte : params.OrderPickupTime}}
                                       ],
                               TimeInDayFrom: { $lte: params.OrderPickupTime.getHours() } ,
                               TimeInDayTo: { $gt: params.OrderPickupTime.getHours() },
                               MinServedQty: { $lte: params.UserServedQty },
                               MaxServedQty: { $gte: params.UserServedQty }
                            }
                }
              });

               if(params.VehicleType != null)
                   queryBuilder = queryBuilder.match({  VehicleType : { $in : [null,params.VehicleType] }});

               if(params.QualityService != null)
                   queryBuilder = queryBuilder.match({  QualityService : { $in : [null,params.QualityService] }});


              queryBuilder.sort({"FromKm": -1})
              .group({
                      _id  : {
                                Country : "$Country",
                                Company : "$Company",
                                Team : "$Team",
                                VehicleType : "$VehicleType",
                                QualityService : "$QualityService",
                                PickupCenterLoc : "$PickupCenterLoc",
                                PickupRadian : "$PickupRadian",
                                FromKm : "$FromKm"
                             },
                      TravelComAdjustId: {$first :"$_id"},
                      FromKm : {$first :"$FromKm"},
                      FixedAmtPerKm : {$first :"$FixedAmtPerKm"},
                      PromotePct : {$first :"$PromotePct"}
                    })
              .exec( function(error,result){

                         if (error) {
                           console.log(error);
                             deferred.reject(new Error(error));
                         }
                         else {
                           deferred.resolve(result);
                         }
               });


   return deferred.promise;

}

function getSystemPromotionAmount(distance,prices,promotions){

       var promoteAmount = 0;
       var lastValue = 0;
       for(var j = 0; j < promotions.length;j++){

         var promote = promotions[j];

         if(j == 0){

              promoteAmount += (promote.FixedAmtPerKm * (distance - promote.FromKm));
              promoteAmount += (promote.PromotePct / 100 * getCompanyPriceAmount(prices,promote.FromKm,distance));

          }else{

              promoteAmount += (promote.FixedAmtPerKm * (lastValue - promote.FromKm));
              promoteAmount += (promote.PromotePct / 100 * getCompanyPriceAmount(prices,promote.FromKm,lastValue));
          }

          lastValue = promote.FromKm;
       }

       return promoteAmount;
}

function getSystemPromotionAmountForAveragePrice(distance,avgUnitPricePerKm,promotions){

       var promoteAmount = 0;
       var lastValue = 0;
       for(var j = 0; j < promotions.length;j++){

         var promote = promotions[j];

         if(j == 0){

              promoteAmount += (promote.FixedAmtPerKm * (distance - promote.FromKm));
              promoteAmount += (promote.PromotePct / 100 * avgUnitPricePerKm * (distance - promote.FromKm));

          }else{

              promoteAmount += (promote.FixedAmtPerKm * (lastValue - promote.FromKm));
              promoteAmount += (promote.PromotePct / 100 * avgUnitPricePerKm * (lastValue - promote.FromKm));
          }

          lastValue = promote.FromKm;
       }

       return promoteAmount;
}


exports.CalculateCountryAveragePrice = function(){

        console.log("refresh CountryAveragePrice");

            TravelComPrice.aggregate(
                        { $match:{
                                $and: [
                                        {IsEnable: 1} ,
                                        {VehicleType: {$ne : null}},
                                        {QualityService: {$ne : null}},
                                        {EffectDateFrom: { $lte: new Date()}},
                                        { $or : [
                                                    {EffectDateTo : null},
                                                    {EffectDateTo : { $gte : new Date()}}
                                                ]}
                                      ]}})
                        .sort({"createdAt": -1})
                        .group({
                                _id  : {
                                          Country : "$Country",
                                          Currency :"$Currency",
                                          VehicleType : "$VehicleType",
                                          QualityService : "$QualityService"
                                       },
                                PricePerKm: { $avg: "$PricePerKm" },
                                OpenningPrice: { $avg: "$OpenningPrice" }
                              })
                        .exec(function (err, data) {

                            if(data){

                                  data.forEach(function(obj){

                                            TravelPriceAverage.findOneAndUpdate( {Country : obj._id.Country ,
                                                                                  Currency : obj._id.Currency ,
                                                                                  VehicleType : obj._id.VehicleType,
                                                                                  QualityService : obj._id.QualityService },
                                                                      {
                                                                          PricePerKm: obj.PricePerKm,
                                                                          OpenningPrice: obj.OpenningPrice,
                                                                          Country:obj._id.Country,
                                                                          Currency:obj._id.Currency,
                                                                          VehicleType:obj._id.VehicleType,
                                                                          QualityService:obj._id.QualityService
                                                                      },{upsert :true},function(err,raw){



                                                                      });



                                  })
                            }
            });

            TravelComPrice.aggregate(
                      { $match:{
                              $and: [
                                      {IsEnable: 1} ,
                                      {QualityService: {$ne : null}},
                                      {EffectDateFrom: { $lte: new Date()}},
                                      { $or : [
                                                  {EffectDateTo : null},
                                                  {EffectDateTo : { $gte : new Date()}}
                                              ]}
                                    ]}})
                      .sort({"createdAt": -1})
                      .group({
                              _id  : {
                                        Country : "$Country",
                                        Currency :"$Currency",
                                        QualityService : "$QualityService"
                                     },
                              PricePerKm: { $avg: "$PricePerKm" },
                              OpenningPrice: { $avg: "$OpenningPrice" }
                            })
                      .exec(function (err, data) {

                          if(data){

                                data.forEach(function(obj){

                                          TravelPriceAverage.findOneAndUpdate( {Country : obj._id.Country ,
                                                                                Currency : obj._id.Currency ,
                                                                                VehicleType : null,
                                                                                QualityService : obj._id.QualityService },
                                                                    {
                                                                        PricePerKm: obj.PricePerKm,
                                                                        OpenningPrice: obj.OpenningPrice,
                                                                        Country:obj._id.Country,
                                                                        Currency:obj._id.Currency,
                                                                        VehicleType:null,
                                                                        QualityService:obj._id.QualityService
                                                                    },{upsert :true},function(err,raw){



                                                                    });



                                })
                          }
            });

            TravelComPrice.aggregate(
                        { $match:{
                                $and: [
                                        {IsEnable: 1} ,
                                        {VehicleType: {$ne : null}},
                                        {EffectDateFrom: { $lte: new Date()}},
                                        { $or : [
                                                    {EffectDateTo : null},
                                                    {EffectDateTo : { $gte : new Date()}}
                                                ]}
                                      ]}})
                        .sort({"createdAt": -1})
                        .group({
                                _id  : {
                                          Country : "$Country",
                                          Currency :"$Currency",
                                          VehicleType : "$VehicleType"
                                       },
                                PricePerKm: { $avg: "$PricePerKm" },
                                OpenningPrice: { $avg: "$OpenningPrice" }
                              })
                        .exec(function (err, data) {

                            if(data){

                                  data.forEach(function(obj){

                                            TravelPriceAverage.findOneAndUpdate( {Country : obj._id.Country ,
                                                                                  Currency : obj._id.Currency ,
                                                                                  VehicleType : obj._id.VehicleType,
                                                                                  QualityService : null },
                                                                      {
                                                                          PricePerKm: obj.PricePerKm,
                                                                          OpenningPrice: obj.OpenningPrice,
                                                                          Country:obj._id.Country,
                                                                          Currency:obj._id.Currency,
                                                                          VehicleType:obj._id.VehicleType,
                                                                          QualityService:null
                                                                      },{upsert :true},function(err,raw){



                                                                      });



                                  })
                            }
            });

            TravelComPrice.aggregate(
                          { $match:{
                                  $and: [
                                          {IsEnable: 1} ,
                                          {EffectDateFrom: { $lte: new Date()}},
                                          { $or : [
                                                      {EffectDateTo : null},
                                                      {EffectDateTo : { $gte : new Date()}}
                                                  ]}
                                        ]}})
                          .sort({"createdAt": -1})
                          .group({
                                  _id  : {
                                            Country : "$Country",
                                            Currency :"$Currency"
                                         },
                                  PricePerKm: { $avg: "$PricePerKm" },
                                  OpenningPrice: { $avg: "$OpenningPrice" }
                                })
                          .exec(function (err, data) {

                              if(data){

                                    data.forEach(function(obj){

                                        TravelPriceAverage.findOneAndUpdate( {Country : obj._id.Country ,
                                                                                Currency : obj._id.Currency ,
                                                                                VehicleType : null,
                                                                                QualityService : null },
                                                                  {
                                                                      PricePerKm: obj.PricePerKm,
                                                                      OpenningPrice: obj.OpenningPrice
                                                                  },{upsert :true},function(err,raw){



                                                                  });
                                    })
                              }
                          });

};

exports.RefreshActiveTravelCompanyPrice = function(){

        console.log("refresh TravelCompanyPrice");
        TravelComPrice.update({},{ IsActive: 0 },{multi :true},function(err, numberAffected){

                TravelComPrice.aggregate(
                            { $match:{
                                    $and: [
                                            {IsEnable: 1} ,
                                            {EffectDateFrom: { $lte: new Date()}},
                                            { $or : [
                                                        {EffectDateTo : null},
                                                        {EffectDateTo : { $gte : new Date()}}
                                                    ]},
                                            {TimeInDayFrom: { $lte: new Date().getHours() }},
                                            {TimeInDayTo: { $gt: new Date().getHours() }}
                                          ]}})
                            .sort({"createdAt": -1})
                            .group({
                                    _id  : {
                                              Company : "$Company",
                                              Team : "$Team",
                                              VehicleType : "$VehicleType",
                                              QualityService : "$QualityService",
                                              FromKm : "$FromKm"
                                           },
                                    TravelComPriceId: {$first :"$_id"}
                                  })
                            .exec(function (err, data) {

                                if(data){

                                      data.forEach(function(obj){

                                          TravelComPrice.findOneAndUpdate( {_id: obj.TravelComPriceId},
                                                                    {
                                                                        IsActive: 1
                                                                    }, {new: true},function(err,raw){

                                                                    });
                                      })
                                }
                            });
            });

};

exports.RefreshActiveTravelCompanyPriceAdjustment = function(){

        console.log("refresh TravelCompanyPriceAdjustment");
        TravelComPriceAdjust.update({},{ IsActive: 0 },{multi :true},function(err, numberAffected){

                TravelComPriceAdjust.aggregate(
                            { $match:{
                                    $and: [
                                            {IsEnable: 1} ,
                                            {EffectDateFrom: { $lte : new Date()}},
                                            { $or : [
                                                        {EffectDateTo : null},
                                                        {EffectDateTo : { $gte : new Date()}}
                                                    ]},
                                            {TimeInDayFrom: { $lte: new Date().getHours() }},
                                            {TimeInDayTo: { $gt: new Date().getHours() }}
                                          ]}})
                            .sort({"createdAt": -1})
                            .group({
                                    _id  : {
                                              Company : "$Company",
                                              Team : "$Team",
                                              VehicleType : "$VehicleType",
                                              QualityService : "$QualityService",
                                              FromKm : "$FromKm"
                                           },
                                    AdjustId: {$first :"$_id"}
                                  })
                            .exec(function (err, data) {

                                if(data){

                                      data.forEach(function(obj){

                                          TravelComPriceAdjust.findOneAndUpdate( {_id: obj.AdjustId},
                                                                    {
                                                                        IsActive: 1
                                                                    }, {new: true},function(err,raw){

                                                                    });
                                      })
                                }
                            })
            });

};

exports.RefreshActiveTravelCompanyPromotion = function(){

        console.log("refresh TravelCompanyPromotion");
        TravelComPromotion.update({},{ IsActive: 0 },{multi :true},function(err, numberAffected){

                TravelComPromotion.aggregate(
                            { $match:{
                                    $and: [
                                            {IsEnable: 1} ,
                                            {EffectDateFrom: { $lte: new Date()}},
                                            { $or : [
                                                        {EffectDateTo : null},
                                                        {EffectDateTo : { $gte : new Date()}}
                                                    ]},
                                            {TimeInDayFrom: { $lte: new Date().getHours() }},
                                            {TimeInDayTo: { $gt: new Date().getHours() }}
                                          ]}})
                            .sort({"createdAt": -1})
                            .group({
                                    _id  : {
                                              Company : "$Company",
                                              Team : "$Team",
                                              VehicleType : "$VehicleType",
                                              QualityService : "$QualityService",
                                              FromKm : "$FromKm"
                                           },
                                    PromotionId: {$first :"$_id"}
                                  })
                            .exec(function (err, data) {

                                if(data){

                                      data.forEach(function(obj){

                                          TravelComPromotion.findOneAndUpdate( {_id: obj.PromotionId},
                                                                    {
                                                                        IsActive: 1
                                                                    }, {new: true},function(err,raw){

                                                                    });
                                      })
                                }
                            })
            });

};

exports.RefreshActiveTravelSystemPromotion = function(){

        console.log("refresh TravelSystemPromotion");
        TravelSysPromotion.update({},{ IsActive: 0 },{multi :true},function(err, numberAffected){

                TravelSysPromotion.aggregate(
                            { $match:{
                                    $and: [
                                            {IsEnable: 1} ,
                                            {EffectDateFrom: { $lte: new Date()}},
                                            { $or : [
                                                        {EffectDateTo : null},
                                                        {EffectDateTo : { $gte : new Date()}}
                                                    ]},
                                            {TimeInDayFrom: { $lte: new Date().getHours() }},
                                            {TimeInDayTo: { $gt: new Date().getHours() }}
                                          ]}})
                            .sort({"createdAt": -1})
                            .group({
                                    _id  : {
                                              Country : "$Country",
                                              VehicleType : "$VehicleType",
                                              QualityService : "$QualityService",
                                              FromKm : "$FromKm"
                                           },
                                    PromotionId: {$first :"$_id"}
                                  })
                            .exec(function (err, data) {

                                if(data){

                                      data.forEach(function(obj){

                                          TravelSysPromotion.findOneAndUpdate( {_id: obj.PromotionId},
                                                                    {
                                                                        IsActive: 1
                                                                    }, {new: true},function(err,raw){

                                                                    });
                                      })
                                }
                            })
            });

};

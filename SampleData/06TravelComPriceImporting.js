var config =require('../Servers/GlobalConfig');
require("mongoose").connect(config.DBAddress);
var Q = require('q');

var data =   require("./06TravelComPriceData.json");
var Company =   require("../Models/Company");
var Driver =   require("../Models/Driver");
var Vehicle =   require("../Models/Vehicle");
var Team =   require("../Models/Team");
var TravelComPrice =   require("../Models/TravelComPrice");

var count = 0
Q.all(data.map(function(item) {
      return Q.resolve(item)
              .then(function(item){
                   ImportData(item);
              });
    })
);

function ImportData(item){
     Q.all([getCompany(item), getTeam(item),initTravelComPrice(item),Q.resolve(item)])
      .spread(createTravelComPrice);
}

function getCompany(item){

    var deferred = Q.defer();

    Company.findOne({Name : item.Company}, function(error,result){

            if (error) {
                deferred.reject(new Error(error));
            }
            else {
                deferred.resolve(result);
            }
     });

     return deferred.promise;
}

function getTeam(item){

      var deferred = Q.defer();
      Company.findOne({Name : item.Company}, function(error,company){

              if (error) {
                    deferred.reject(null);
              }
              else {
                    if(company == null){
                        deferred.resolve(null);
                    }else {
                        Team.findOne({Name : item.Team, Company : company._id}, function(error,team){

                                if (error) {
                                    deferred.reject(null);
                                }
                                else {
                                    deferred.resolve(team);
                                }
                         });
                    }
              }
       });

       return deferred.promise;
}

function initTravelComPrice(item){

      var deferred = Q.defer();

      var price = new TravelComPrice();
      price.Priority =  item.Priority;
      price.PickupCenterLoc =  item.PickupCenterLoc;
      price.PickupRadian =  item.PickupRadian;
      price.VehicleType =  item.VehicleType;
      price.QualityService =  item.QualityService;
      price.EffectDateFrom =  item.EffectDateFrom;
      price.EffectDateTo =  item.EffectDateTo;
      price.TimeInDayFrom =  item.TimeInDayFrom;
      price.TimeInDayTo =  item.TimeInDayTo;
      price.MinServedQty = item.MinServedQty;
      price.MaxServedQty = item.MaxServedQty;
      price.FromKm =  item.FromKm;
      price.Currency =  item.Currency;
      price.OpenningPrice =  item.OpenningPrice;
      price.PricePerKm =  item.PricePerKm;

      deferred.resolve(price);

      return deferred.promise;

}


var count = 0
function createTravelComPrice( company,team ,price,oldItem){

    if(  company == null || price == null){

      if(company == null)
          console.log("company is null at " + oldItem.Company);

      if(price == null)
          console.log("price is null  ");

      return null;
    }


    price.Company= company._id;
    if(team != null){
      price.Team= team._id;
      price.Country = team.Country;
    }
    price.save(function(err,data){
      if(err)
          console.log(err);
    });

    count++;
    console.log("price  " + count);

}

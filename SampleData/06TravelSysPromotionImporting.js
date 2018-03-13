var config =require('../Servers/GlobalConfig');
require("mongoose").connect(config.DBAddress);
var Q = require('q');

var data =   require("./06TravelSysPromotionData.json");
var TravelSysPromotion =   require("../Models/TravelSysPromotion");

var count = 0
Q.all(data.map(function(item) {
      return Q.resolve(item)
              .then(function(item){
                   ImportData(item);
              });
    })
);

function ImportData(item){
     Q.all([initTravelSysPromotion(item),Q.resolve(item)])
      .spread(createTravelSysPromotion);
}

function initTravelSysPromotion(item){

      var deferred = Q.defer();

      var price = new TravelSysPromotion();
      price.Country =  item.Country;
      price.PickupCenterLoc =  item.PickupCenterLoc;
      price.PickupRadian =  item.PickupRadian;
      price.VehicleType =  item.VehicleType;
      price.QualityService =  item.QualityService;
      price.Priority =  item.Priority;
      price.EffectDateFrom =  item.EffectDateFrom;
      price.EffectDateTo =  item.EffectDateTo;
      price.TimeInDayFrom =  item.TimeInDayFrom;
      price.TimeInDayTo =  item.TimeInDayTo;
      price.MinServedQty = item.MinServedQty;
      price.MaxServedQty = item.MaxServedQty;
      price.FromKm =  item.FromKm;
      price.Currency =  item.Currency;
      price.PromotePct =  item.PromotePct;
      price.FixedAmtPerKm =  item.FixedAmtPerKm;

      deferred.resolve(price);

      return deferred.promise;

}


var count = 0
function createTravelSysPromotion( promote,oldItem){

    if(promote == null){

      console.log("promote is null  ");

      return null;
    }

    promote.save(function(err,data){
      if(err)
          console.log(err);
    });

    count++;
    console.log("promote  " + count);

}


app=require("../../../BaseApps/BaseCalcApp")("TravelComPrice",{});

var TravelPriceHelper = require("../../Utils/TravelPriceHelper");

TravelPriceHelper.RefreshActiveTravelCompanyPrice();
setInterval(function() {

      TravelPriceHelper.RefreshActiveTravelCompanyPrice();

}, 1000*60*30);

TravelPriceHelper.RefreshActiveTravelCompanyPriceAdjustment();
setInterval(function() {

      TravelPriceHelper.RefreshActiveTravelCompanyPriceAdjustment();

}, 1000*60*35);




TravelPriceHelper.RefreshActiveTravelCompanyPromotion();
setInterval(function() {

      TravelPriceHelper.RefreshActiveTravelCompanyPromotion();

}, 1000*60*40);


TravelPriceHelper.RefreshActiveTravelSystemPromotion();
setInterval(function() {

      TravelPriceHelper.RefreshActiveTravelSystemPromotion();

}, 1000*60*45);


TravelPriceHelper.CalculateCountryAveragePrice();

setInterval(function() {

    if( new Date().getHours() == 19 && new Date().getMinutes() < 40 && new Date().getMinutes() >= 30) // 2 gio dem VN
          TravelPriceHelper.CalculateCountryAveragePrice();

}, 1000*60*10);

module.exports = app;


app=require("../../../BaseApps/BaseCalcApp")("Driver",{});


var Driver = require("../../../Models/Driver");
var Team = require("../../../Models/Team");
var DriverStatus     =   require("../../../Models/DriverStatus");
var VehicleStatus     =   require("../../../Models/VehicleStatus");
var TravelOrder = require("../../../Models/TravelOrder");
var WorkingPlan = require("../../../Models/WorkingPlan");
var DriverHelper = require('../../Utils/DriverHelper');
var DriverWorkingPlanHelper = require('../../Utils/DriverWorkingPlanHelper');
var DriverStatisticHelper = require('../../Utils/DriverStatisticHelper');

DriverStatisticHelper.CalculateStatisticForAllDrivers();

setInterval(function() {

    if( new Date().getHours() == 19 && new Date().getMinutes() < 10)  // 2 gio dem VN
          DriverStatisticHelper.CalculateStatisticForAllDrivers();


  }, 1000*60*10);


DriverWorkingPlanHelper.RefreshWorkingPlanForAllDrivers();

setInterval(function() {

    if( new Date().getHours() == 20 && new Date().getMinutes() < 10)   // 3 gio dem VN
          DriverWorkingPlanHelper.RefreshWorkingPlanForAllDrivers();

}, 1000*60*10);



module.exports = app;

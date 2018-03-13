
var TravelOrder = require("../../../Models/TravelOrder");
var DriverStatus = require("../../../Models/DriverStatus");
var DriverHelper = require('../../Utils/DriverHelper');

app=require("../../../BaseApps/BaseInsertApp")("WorkingPlan",
  {
      expireRecord : -1,
      expireDataset : -1,

      customInsertAPIs : function(router) {

        return router;
      }
  }
);

module.exports = app;

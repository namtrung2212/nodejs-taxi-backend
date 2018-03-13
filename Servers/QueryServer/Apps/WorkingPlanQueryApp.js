
var DriverStatus     =   require("../../../Models/DriverStatus");
var VehicleStatus     =   require("../../../Models/VehicleStatus");
var WorkingPlan     =   require("../../../Models/WorkingPlan");
var DriverHelper = require('../../Utils/DriverHelper');
var DriverWorkingPlanHelper = require('../../Utils/DriverWorkingPlanHelper');


app=require("../../../BaseApps/BaseQueryApp")("WorkingPlan",
  {
      expireRecord : -1,
      expireDataset : -1,

      customQueryAPIs : function(router) {


        router.route("/GetDefaultWorkingPlan/:id").get(function(req,res){

              var driverId = req.params.id;
              DriverWorkingPlanHelper.GetDefaultWorkingPlan(driverId).then(function(workingplan){

                  res.json(workingplan);

              });

        });

        return router;
      }
  }
);

module.exports = app;

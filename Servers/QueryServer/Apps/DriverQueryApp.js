
var DriverStatus     =   require("../../../Models/DriverStatus");

app=require("../../../BaseApps/BaseQueryApp")("Driver",
  {
      expireRecord : -1,
      expireDataset : -1,

      customQueryAPIs : function(router) {


        router.route("/ActivateDriverAccount/:id")
          .get(function(req,res){

                      var DriverStatus = require("../../../Models/DriverStatus");
                      DriverStatus.update({"Driver" : req.params.id, "IsActivated" : 0 },{"IsActivated" : 1, "ActivatedDate" : Date()},function(err,data){

                      });

                      res.json("done");
          });


        return router;
      }
  }
);

module.exports = app;


var TravelOrder = require("../../../Models/TravelOrder");
var DriverBidding = require("../../../Models/DriverBidding");
var OrderHelper = require('../../Utils/TravelOrderHelper');

app=require("../../../BaseApps/BaseInsertApp")("DriverBidding",
  {
      expireRecord : -1,
      expireDataset: -1,

      customInsertAPIs : function(router) {


                router.route("/DriverCreateBidding")
                .post(function(req,res){

                          OrderHelper.DriverCreateBidding(req).then(function(bidding){

                                res.json(bidding);

                          });

                });

        return router;
      }
  }
);

module.exports = app;

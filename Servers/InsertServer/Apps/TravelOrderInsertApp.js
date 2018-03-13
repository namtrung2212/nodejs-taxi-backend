
var TravelOrderHelper = require('../../Utils/TravelOrderHelper');
var DriverStatisticHelper = require('../../Utils/DriverStatisticHelper');
app=require("../../../BaseApps/BaseInsertApp")("TravelOrder",
  {
      expireRecord : -1,
      expireDataset : -1,

      customInsertAPIs : function(router) {

        router.post("/UserCreateOrder", function(req, res) {

                  TravelOrderHelper.UserCreateOrder(req).then(function(order){

                        res.json(order);

                  });

        });

        router.patch("/updateOrder/:id", function(req, res) {

                  TravelOrderHelper.updateTravelOrderFromReq(req).then(function(order){

                        if(order.Rating > 0){
                            DriverStatisticHelper.CalculateDriverStatistic(order.Driver);
                        }
                        res.json(order);

                  });

        });



        return router;
      }
  }
);

module.exports = app;

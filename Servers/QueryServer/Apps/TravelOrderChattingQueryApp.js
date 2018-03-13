
var TravelOrderChatting     =   require("../../../Models/TravelOrderChatting");

app=require("../../../BaseApps/BaseQueryApp")("TravelOrderChatting",
  {
      expireRecord : -1,
      expireDataset : -1,

      customQueryAPIs : function(router) {


                  router.route("/SetAllMessageToViewedByUser/:id")
                    .get(function(req,res){

console.log("SetAllMessageToViewedByUser");
                              TravelOrderChatting.update(
                                 { Order: req.params.id , IsUser : 0, IsViewed : 0 },
                                 { IsViewed: 1}, { multi: true }, function (err, data) {
                                 console.log("data = " + data);
                                      res.json("done");
                              });

                    });


                    router.route("/SetAllMessageToViewedByDriver/:id")
                      .get(function(req,res){

                        console.log("SetAllMessageToViewedByDriver");
                                TravelOrderChatting.update(
                                  { Order: req.params.id , IsUser : 1, IsViewed : 0 },
                                  { IsViewed: 1},
                                  { multi: true }, function (err, data) {
                                  console.log("data = " + data);
                                        res.json("done");
                                });

                      });



        return router;
      }
  }
);

module.exports = app;

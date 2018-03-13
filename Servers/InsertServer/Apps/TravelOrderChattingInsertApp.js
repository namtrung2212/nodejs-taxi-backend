
var ChatHelper = require('../../Utils/ChatHelper');

app=require("../../../BaseApps/BaseInsertApp")("TravelOrderChatting",
  {
      expireRecord : -1,
      expireDataset: -1,

      customInsertAPIs : function(router) {

              router.post("/UserChatToDriver", function(req, res) {

                        ChatHelper.UserChatToDriver(req).then(function(order){

                              res.json(order);

                        });

              });

              router.post("/DriverChatToUser", function(req, res) {

                        ChatHelper.DriverChatToUser(req).then(function(order){

                              res.json(order);

                        });

              });


        return router;
      }
  }
);

module.exports = app;

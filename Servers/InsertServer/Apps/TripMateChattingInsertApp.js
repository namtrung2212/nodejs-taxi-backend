
var ChatHelper = require('../../Utils/ChatHelper');

app=require("../../../BaseApps/BaseInsertApp")("TripMateChatting",
  {
      expireRecord : -1,
      expireDataset: -1,

      customInsertAPIs : function(router) {

              router.post("/UserChatToGroup", function(req, res) {

                        ChatHelper.UserChatToGroup(req).then(function(order){

                              res.json(order);

                        });

              });


        return router;
      }
  }
);

module.exports = app;

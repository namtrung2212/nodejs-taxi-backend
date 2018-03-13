
app=require("../../../BaseApps/BaseInsertApp")("User",
  {
      expireRecord : -1,
      expireDataset : -1,

      customInsertAPIs : function(router) {
        return router;
      }
  }
);
module.exports = app;

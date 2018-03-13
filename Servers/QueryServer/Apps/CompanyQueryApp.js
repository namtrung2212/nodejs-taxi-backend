
app=require("../../../BaseApps/BaseQueryApp")("Company",
  {
      expireRecord : -1,
      expireDataset : -1,

      customQueryAPIs : function(router) {
        return router;
      }
  }
);


module.exports = app;

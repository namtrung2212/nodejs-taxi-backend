
var BusinessAccount = require("../../../Models/BusinessAccount");
var BusinessCard = require("../../../Models/BusinessCard");
var UserStatus = require("../../../Models/UserStatus");

app=require("../../../BaseApps/BaseQueryApp")("User",
  {
      expireRecord : -1,
      expireDataset : -1,

      customQueryAPIs : function(router) {


                  router.route("/ActivateUserAccount/:id")
                    .get(function(req,res){

                                BusinessAccount.update({"Manager" : req.params.id, "IsActivated" : 0 },{"IsActivated" : 1,ActivatedDate : Date()},function(err,data){

                                });


                                BusinessCard.update({"CardOwner" : req.params.id, "IsActivated" : 0 },{"IsActivated" : 1, "ActivatedDate" : Date()},function(err,data){

                                });

                                UserStatus.update({"User" : req.params.id, "IsActivated" : 0 },{"IsActivated" : 1, "ActivatedDate" : Date()},function(err,data){

                                });

                                res.json("done");
                    });



        return router;
      }
  }
);

module.exports = app;

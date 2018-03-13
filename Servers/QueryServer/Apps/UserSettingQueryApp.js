var request = require('request');
var mongoose = require('mongoose');
//mongoose.Promise = require('bluebird');

var Q = require('q');

var smsGateway = {
  api_key : "ebbb1b30",
  api_secret : "7d33ace9ada4663d",
  brand : "SCONNECTING"
};


module.exports = require("../../../BaseApps/BaseQueryApp")("UserSetting",{
    expireRecord : -1,
    expireDataset : -1,

    customQueryAPIs : function(router) {

      router.route("/Authenticate/SendVerifyCode").get(function(req,res){

              /*
              var reqStr="https://api.nexmo.com:443/verify/json?api_key="+smsGateway.api_key+
                                                           "&api_secret="+smsGateway.api_secret+
                                                                "&brand="+smsGateway.brand+
                                                              "&country="+req.query["country"]+
                                                               "&number="+req.query["PhoneNo"];
              request.get(reqStr, function (error, response, body) {
                    res.json(JSON.parse(body));
              });
              */

                res.json({"request_id" : "abc12323532"});
      });

      router.route("/Authenticate/CheckVerifyCode").get(function(req,res){

            /*
              var reqStr="https://api.nexmo.com:443/verify/check/json?api_key="+smsGateway.api_key+
                                                                 "&api_secret="+smsGateway.api_secret+
                                                                 "&request_id="+req.query["request_id"]+
                                                                       "&code="+req.query["code"];
              request.get(reqStr, function (error, response, body) {

                    var data=JSON.parse(body);
                    if(!error && data.status == 0){
                          createUser(req.query["PhoneNo"],res);
                    }else{
                          res.json({"error" : true,"message" : data});
                    }

              });

              */

              createUser(req.query["PhoneNo"],res);
      });
      return router;
    }
});




function createUser(number,res){

      var UserSetting = require("../../../Models/UserSetting");
      var User = require("../../../Models/User");

       User.findOne({PhoneNo : number }).exec()

       .then(function(user){
              if(!user)
                  return new User({ PhoneNo: number});
              return user;
        })

        .then(function(user){

              var deferred = Q.defer();

              user.save(function(err,obj){

                if(err){
                  console.log(err);
                  deferred.reject(new Error(err));
                }else{
                  deferred.resolve(obj);
                }
              });

              return deferred.promise;

        })

        .then(function(user){

                res.json({"error" : false,"message" : user._id});
              return UserSetting.findOneAndUpdate({User : user}, { IsVerified: 1,VerifiedDate:Date.now() }, {new: true},function(err,doc){return doc;});
        });
}

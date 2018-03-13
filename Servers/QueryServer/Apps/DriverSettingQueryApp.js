var request = require('request');
var mongoose = require('mongoose');
//mongoose.Promise = require('bluebird');

var Q = require('q');

var smsGateway = {
  api_key : "ebbb1b30",
  api_secret : "7d33ace9ada4663d",
  brand : "SCONNECTING"
};


module.exports = require("../../../BaseApps/BaseQueryApp")("DriverSetting",{
    expireRecord : 1,
    expireDataset: 1,

    customQueryAPIs : function(router) {

      router.route("/Authenticate/SendVerifyCode").get(function(req,res){

              var Driver = require("../../../Models/Driver");
              Driver.findOne({CitizenID : req.query["CitizenID"], Country : req.query["country"] },function(err,driver){

                  if(err || driver == null){

                        res.json({"error" : true,"message" : "WrongCitizenID"});

                  }else{

                        var reqStr="https://api.nexmo.com:443/verify/json?api_key="+smsGateway.api_key+
                                                                     "&api_secret="+smsGateway.api_secret+
                                                                          "&brand="+smsGateway.brand+
                                                                        "&country="+req.query["country"]+
                                                                         "&number="+driver.PhoneNo;
                      //  request.get(reqStr, function (error, response, body) {
                              res.json({"request_id" : "abc12323532"});
                              //res.json({"request_id" : JSON.parse(body)});
                      //  });

                  }
              })

      });

      router.route("/Authenticate/CheckVerifyCode").get(function(req,res){


              var reqStr="https://api.nexmo.com:443/verify/check/json?api_key="+smsGateway.api_key+
                                                                 "&api_secret="+smsGateway.api_secret+
                                                                 "&request_id="+req.query["request_id"]+
                                                                       "&code="+req.query["code"];



                        /*
              request.get(reqStr, function (error, response, body) {

                    var data=JSON.parse(body);
                    if(!error && data.status == 0){
                          createDriver(req.query["PhoneNo"],res);
                    }else{
                          res.json({"error" : true,"message" : data});
                    }

              });
*/


              verifyDriver(req.query["CitizenID"],res);
      });
      return router;
    }
});




function verifyDriver(number,res){

      var DriverSetting = require("../../../Models/DriverSetting");
      var Driver = require("../../../Models/Driver");

       Driver.findOne({CitizenID : number }).exec()

       .then(function(Driver){
              if(!Driver){
                  res.json({"error" : true,"message" : "WrongCitizenID"});
              }else{
                  return Driver;
              }
        })

        .then(function(Driver){

                res.json({"error" : false,"message" : Driver._id});
              return DriverSetting.findOneAndUpdate({Driver : Driver}, { IsVerified: 1,VerifiedDate:Date.now() }, {new: true},function(err,doc){return doc;});
        });
}


var Q = require('q');

var User = require("../../Models/User");
var UserStatus = require("../../Models/UserStatus");



exports.getUserStatusByUserId = function(userId){

  var deferred = Q.defer();

  UserStatus.findOne({User : userId}, function(error,result){

          if (error) {
              deferred.reject(new Error(error));
          }
          else {
              deferred.resolve(result);
          }
   });

   return deferred.promise;

};

var config =require('../Servers/GlobalConfig');
require("mongoose").connect(config.DBAddress);

var Q = require('q');

var data =   require("./09UserPayCard.json");

var User     =   require("../Models/User");
var UserPayCard =   require("../Models/UserPayCard");



data.map(function(item) {

      setUser(item).then(function (user) {

        if(user){
              var card = UserPayCard()
              card.User = user._id;
              card.Currency = item.Currency;
              card.Bank = item.Bank;
              card.BankAcc = item.BankAcc;
              card.BankAccOwner = item.BankAccOwner;
              card.CardType = item.CardType;
              card.CardNo = item.CardNo;
              card.CardExpireDate = item.CardExpireDate;
              card.SecurityCode = item.SecurityCode;
              card.IsVerified = item.IsVerified;

              UserPayCard.create(card,function(err)
              {
                if(err)
                    console.log(err);
                else
                    console.log("done");
              });
        }
      });

})


function setUser(item){

  var deferred = Q.defer();

  if(item.UserName != null && item.UserPhoneNo != null){

        User.findOne({Name : item.UserName , PhoneNo : item.UserPhoneNo}, function(err,obj){

              if(obj){
                  deferred.resolve(obj);
              }else{
                  console.log(err);
                  deferred.reject(new Error(err));
              }

       });
  }

  return deferred.promise;

}

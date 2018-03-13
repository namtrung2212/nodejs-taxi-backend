var config =require('../Servers/GlobalConfig');
var mongoose    =   require("mongoose");
mongoose.connect(config.DBAddress);


var data =   require("./05UserData.json");

var User =   require("../Models/User");


data.map(function(item) {

      var user = User();
      user.Name = item.Name;
      user.Birthday = item.Birthday;
      user.CitizenID = item.CitizenID;
      user.CitizenIDDate = item.CitizenIDDate;
      user.Country = item.Country;
      user.Province = item.Province;
      user.Gender = item.Gender;
      user.PhoneNo = item.PhoneNo;
      user.EmailAddr = item.EmailAddr;

      User.create(user,function(err)
      {
        if(err)
            console.log(err);
        else
            console.log(user.Name);
      });


});
/*

userModel.create(userdata,function(err)
{
  if(err)
      console.log(err);
  else
      console.log("done");
});
*/

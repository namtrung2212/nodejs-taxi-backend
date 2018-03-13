var config =require('../Servers/GlobalConfig');
require("mongoose").connect(config.DBAddress);


var data =   require("./01CompanyData.json");

var schema =   require("../Models/Company");
schema.create(data,function(err)
{
  if(err)
      console.log(err);
  else
      console.log("done");
});

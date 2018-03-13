var config =require('../Servers/GlobalConfig');
require("mongoose").connect(config.DBAddress);


var vehicleTypeData =   require("./00VehicleTypeData.json");
var VehicleType =   require("../Models/VehicleType");
VehicleType.create(vehicleTypeData,function(err)
{
  if(err)
      console.log(err);
  else
      console.log("done");
});

var vehicleTypeData =   require("./00QualityServiceTypeData.json");
var QualityServiceType =   require("../Models/QualityServiceType");
QualityServiceType.create(vehicleTypeData,function(err)
{
  if(err)
      console.log(err);
  else
      console.log("done");
});

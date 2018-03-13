var config =require('../Servers/GlobalConfig');
require("mongoose").connect(config.DBAddress);
var Q = require('q');

var data =   require("./03DriverData.json");
var DriverWorkingPlanHelper =   require("../Servers/Utils/DriverWorkingPlanHelper");

var count = 0
Q.all(data.map(function(item) {

            DriverWorkingPlanHelper.RegisterNewDriver(item);

    })
);


app=require("../../../BaseApps/BaseCalcApp")("VehicleType",{});

var VehicleType = require("../../../Models/VehicleType");
var QualityServiceType = require("../../../Models/QualityServiceType");


refreshVehicleType();

setInterval(function() {

  refreshVehicleType();

}, 1000*60*60);


function refreshVehicleType(){

        console.log("refresh VehicleType");

        var currentHour = new Date().getHours();

        VehicleType.update({},{ IsActive: 0 },{multi :true},function(err, numberAffected){

                VehicleType.aggregate(
                            { $match:{
                                    $and: [
                                            {IsEnable: 1} ,
                                            {EffectDateFrom: { $lte: new Date()}},
                                            { $or : [
                                                        {EffectDateTo : null},
                                                        {EffectDateTo : { $gte : new Date()}}
                                                    ]}
                                          ]}})
                            .sort({"createdAt": -1})
                            .group({
                                    _id  : {
                                              Country : "$Country",
                                              Name : "$Name"
                                           },
                                    VehicleTypeId: {$first :"$_id"}
                                  })
                            .exec(function (err, data) {

                                if(data){

                                      data.forEach(function(obj){

                                          VehicleType.findOneAndUpdate( {_id: obj.VehicleTypeId},
                                                                    {
                                                                        IsActive: 1
                                                                    }, {new: true},function(err,raw){

                                                                    });
                                      })
                                }
                            })
            });

            console.log("refresh QualityServiceType");

            QualityServiceType.update({},{ IsActive: 0 },{multi :true},function(err, numberAffected){

                    QualityServiceType.aggregate(
                                { $match:{
                                        $and: [
                                                {IsEnable: 1} ,
                                                {EffectDateFrom: { $lte: new Date()}},
                                                { $or : [
                                                            {EffectDateTo : null},
                                                            {EffectDateTo : { $gte : new Date()}}
                                                        ]}
                                              ]}})
                                .sort({"createdAt": -1})
                                .group({
                                        _id  : {
                                                  Country : "$Country",
                                                  Name : "$Name"
                                               },
                                        QualityServiceTypeId: {$first :"$_id"}
                                      })
                                .exec(function (err, data) {

                                    if(data){

                                          data.forEach(function(obj){

                                              QualityServiceType.findOneAndUpdate( {_id: obj.QualityServiceTypeId},
                                                                        {
                                                                            IsActive: 1
                                                                        }, {new: true},function(err,raw){

                                                                        });
                                          })
                                    }
                                })
                });

}

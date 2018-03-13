
var Q = require('q');

var Driver = require("../../Models/Driver");
var DriverStatus = require("../../Models/DriverStatus");
var Vehicle =   require("../../Models/Vehicle");
var VehicleStatus = require("../../Models/VehicleStatus");
var WorkingPlan = require("../../Models/WorkingPlan");
var TravelOrder = require("../../Models/TravelOrder");
var Team = require("../../Models/Team");
var Company = require("../../Models/Company");
var DriverHelper = require("./DriverHelper");


var exports = module.exports = {};



exports.getDriverWorkingPlanByDriver = function(driver){

    var deferred = Q.defer();

    if(driver != null){
          WorkingPlan.findOne({Driver: driver._id, IsActive : 1}, function(error,result){

                  if (error) {
                      deferred.reject(new Error(error));
                  }
                  else {
                      deferred.resolve(result);
                  }
           });
   }else{
         deferred.resolve(null);
   }

   return deferred.promise;

};

exports.RefreshDriverWorkingPlan = function(driverId){

      var deferred = Q.defer();

      WorkingPlan.find({ $and: [
                                  {Driver: driverId} ,
                                  {IsEnable: 1} ,
                                  {FromDateTime: { $lte: new Date()}},
                                  { $or : [
                                              {ToDateTime : null},
                                              {ToDateTime : { $gt : new Date()}}
                                          ]}
                                ]
      }).sort({"createdAt": -1})
        .exec(function(err,data){


              if(data != null && data.length > 0){

                    var obj = data[0];

                    DriverStatus.findOneAndUpdate( {Driver: obj.Driver},
                                              {
                                                  WorkingPlan:obj._id,
                                                  Company:obj.Company,
                                                  CompanyName:obj.CompanyName,
                                                  Team:obj.Team,
                                                  TeamName:obj.TeamName,
                                                  Country:obj.Country
                                              },function(err,raw){

                                              });


                    VehicleStatus.findOneAndUpdate( {Vehicle: obj.Vehicle},
                                              {
                                                  QualityService:obj.QualityService,
                                                  Company:obj.Company,
                                                  CompanyName:obj.CompanyName,
                                                  Team:obj.Team,
                                                  TeamName:obj.TeamName,
                                                  Country:obj.Country
                                              },function(err,raw){

                                              });

                    if(obj.IsLeader == 1){
                      Team.findOneAndUpdate({_id:obj.Team},{Leader: obj.Driver}, function(err,raw){

                      });
                    }

                    WorkingPlan.update({Driver: obj.Driver}, { IsActive: 0 },{multi :true}, function(err, numberAffected){

                        WorkingPlan.findOneAndUpdate( {_id: obj._id},
                                                  {
                                                      IsActive: 1
                                                  },function(err,raw){

                                                        deferred.resolve(raw);

                                                  });
                    });


              }else{


                  DriverStatus.findOneAndUpdate( {Driver: driverId},
                                            {
                                                WorkingPlan:null,
                                                Company:null,
                                                CompanyName:null,
                                                Team:null,
                                                TeamName:null
                                            },function(err,raw){

                                            });
                  deferred.resolve(null);
              }

      });


      return deferred.promise;
};

exports.RefreshWorkingPlanForAllDrivers = function(){

      console.log("refresh Drivers WorkingPlan");
      WorkingPlan.aggregate({ $match:{
                                        $and: [
                                                {IsEnable: 1} ,
                                                {FromDateTime: { $lt: new Date()}},
                                                { $or : [
                                                            {ToDateTime : null},
                                                            {ToDateTime : { $gt : new Date()}}
                                                        ]}
                                              ]}})
                  .sort({"createdAt": -1})
                  .group({
                          _id  : "$Driver",
                          WorkingPlanId: {$first: "$_id"},
                          Vehicle: {$first: "$Vehicle"},
                          Company: {$first: "$Company"},
                          CompanyName: {$first: "$CompanyName"},
                          Team: {$first: "$Team"},
                          TeamName: {$first: "$TeamName"},
                          Country: {$first: "$Country"},
                          QualityService: {$first: "$QualityService"},
                          IsLeader: {$first: "$IsLeader"}
                        })
                  .exec(function (err, data) {


                      if(data){
                            data.forEach(function(obj){


                                  DriverStatus.findOneAndUpdate( {Driver: obj._id},
                                                            {
                                                                WorkingPlan:obj.WorkingPlanId,
                                                                Company:obj.Company,
                                                                CompanyName:obj.CompanyName,
                                                                Team:obj.Team,
                                                                TeamName:obj.TeamName,
                                                                Country:obj.Country
                                                            },function(err,raw){

                                                            });


                                  VehicleStatus.findOneAndUpdate( {Vehicle: obj.Vehicle},
                                                            {
                                                                QualityService:obj.QualityService,
                                                                Company:obj.Company,
                                                                CompanyName:obj.CompanyName,
                                                                Team:obj.Team,
                                                                TeamName:obj.TeamName,
                                                                Country:obj.Country
                                                            },function(err,raw){

                                                            });

                                  if(obj.IsLeader == 1){
                                    Team.findOneAndUpdate({_id:obj.Team},{Leader: obj._id}, function(err,raw){

                                    });
                                  }

                                  WorkingPlan.update({Driver: obj._id}, { IsActive: 0 },{multi :true}, function(err, numberAffected){

                                      WorkingPlan.findOneAndUpdate( {_id: obj.WorkingPlanId},
                                                                {
                                                                    IsActive: 1
                                                                },function(err,raw){

                                                                });
                                  });




                            })
                      }
                  });

};

exports.GetDefaultWorkingPlan = function(driverId){

      var deferred = Q.defer();

      Q.all([exports.RefreshDriverWorkingPlan(driverId),Q.resolve(driverId)])
      .spread(function(workingplan,driverId){

              WorkingPlan.findOne({Driver: driverId, IsActive: 1},function(err,plan){

                      deferred.resolve(plan);

              });

      });

      return deferred.promise;
};

exports.RegisterNewDriver = function(data){

     Q.all([createDriverIfNotExisted(data), getCompany(data), getTeam(data), createVehicleIfNotExisted(data),initWorkingPlan(data)])
      .spread(function(driver, company,team , vehicle,working){

              console.log(" company = " +company);
              console.log(" team = " +team);
              console.log(" vehicle = " +vehicle);

              if( !driver || !company || !team || !vehicle || !working)
                  return null;

              working.Driver= driver._id;
            //  working.DriverName = driver.Name;
            //  working.CitizenID = driver.CitizenID;
              working.Company= company._id;
              //working.CompanyName= company.Name;
              working.Team= team._id;
              //working.TeamName= team.Name;
            //  working.Country = team.Country;
              working.Vehicle= vehicle._id;
            //  working.VehicleNo= vehicle.No;
            //  working.VehicleType= vehicle.VehicleType;
            //  working.VehicleProvince= vehicle.Province;
            //  working.VehicleBrand= vehicle.Brand;

               WorkingPlan.findOne({Driver : driver._id ,
                                    Company : company._id,
                                    Vehicle : vehicle._id,
                                    FromDateTime : working.FromDateTime},function(error,result){

                      if (!error){

                          if(result){
                              working._id= result._id;
                              working.isNew = false;
                          }

                          working.save(function(err,obj){

                          });

                      }
               });

      });

};

function createDriverIfNotExisted(item){

  var deferred = Q.defer();

  Driver.findOne({Name : item.DriverName , CitizenID : item.DriverCitizenID}, function(error,result){

          if (error) {
              deferred.reject(new Error(error));
          }
          else {

            var driver = new Driver();

            driver.Name = item.DriverName;
            driver.Birthday = item.DriverBirthday;
            driver.Gender = item.DriverGender;
            driver.Province = item.DriverProvince;
            driver.Country = item.DriverCountry;
            driver.PhoneNo = item.DriverPhoneNo;
            driver.CitizenID = item.DriverCitizenID;
            driver.CitizenIDDate = item.DriverCitizenIDDate;


            if(result)
                driver._id= result._id;

            driver.save(function(err,obj,numberAffected){
              if(err)
                console.log(err);
              deferred.resolve(obj);
            });


          }
   });

   return deferred.promise;

}

function getCompany(item){

    var deferred = Q.defer();

    Company.findOne({Name : item.Company}, function(error,result){

            if (error) {
                deferred.reject(new Error(error));
            }
            else {
                deferred.resolve(result);
            }
     });

     return deferred.promise;
}

function getTeam(item){

      var deferred = Q.defer();
      Company.findOne({Name : item.Company}, function(error,company){

              if (error) {
                    deferred.reject(new Error(error));
              }
              else {
                    if(!company){
                        deferred.resolve(null);
                    }else {
                        Team.findOne({Name : item.Team, Company : company._id}, function(error,team){

                                if (error) {
                                    deferred.reject(new Error(error));
                                }
                                else {
                                    deferred.resolve(team);
                                }
                         });
                    }
              }
       });

       return deferred.promise;
}

function createVehicleIfNotExisted(item){

    var deferred = Q.defer();

    Vehicle.findOne({No : item.VehicleNo , Country : item.VehicleCountry}, function(error,result){

            if (error) {
                deferred.reject(new Error(error));
            }
            else {

              var vehicle  = new Vehicle();
              vehicle.Country = item.VehicleCountry;
              vehicle.Province = item.VehicleProvince;
              vehicle.No = item.VehicleNo;
              vehicle.VehicleType = item.VehicleType;
              vehicle.Brand = item.VehicleBrand;
              vehicle.Version = item.VehicleVersion;
              vehicle.OwnerName = item.VehicleOwnerName;
              vehicle.OwnerAddress = item.VehicleOwnerAddress;
              vehicle.OwnerPhoneNo = item.VehicleOwnerPhoneNo;

              if(result)
                  vehicle._id= result._id;

              vehicle.save(function(err,obj,numberAffected){
                if(err)
                  console.log(err);
                deferred.resolve(obj);
              });

            }
     });

     return deferred.promise;
}

function initWorkingPlan(item){

      var deferred = Q.defer();

      var working = new WorkingPlan();
      working.IsLeader =  item.IsLeader;
      working.Priority =  item.Priority;
      working.QualityService = item.QualityService;
      working.FromDateTime =  item.FromDateTime;
      working.ToDateTime =  item.ToDateTime;

      deferred.resolve(working);

      return deferred.promise;

}


exports.RegisterNewWorkingPlanForDriver = function(driverId,vehicleId,qualityService,isLeader){

      var deferred = Q.defer();

       Q.all([DriverHelper.getDriver(driverId),DriverHelper.getDriverStatus(driverId), DriverHelper.getVehicle(vehicleId),Q.resolve(qualityService),Q.resolve(isLeader)])
        .spread(function(driver, driverStatus,vehicle,qualityService,isLeader){

                if( !driver || !driverStatus  || !vehicle ){
                    deferred.resolve(null);
                    return;
                }

                var working = new WorkingPlan();
                working.IsLeader =  isLeader;
                working.QualityService = qualityService;
                working.FromDateTime =  new Date();
                working.Driver= driver._id;
                working.Company= driverStatus.Company;
                working.Team= driverStatus.Team;
                working.Vehicle= vehicle._id;
                working.save(function(err,obj){

                    if(err){
                        deferred.resolve(null);

                    }else{

                          exports.GetDefaultWorkingPlan(driver._id).then(function(defaultPlan){

                                  deferred.resolve(defaultPlan);
                          });
                    }
                });

        });


        return deferred.promise;

};

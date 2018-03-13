var Q = require('q');
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Driver" : { type: ObjectId, ref: 'Driver' , default: null },
    "DriverName" : {type: String, default: null},
    "CitizenID" : {type: String, default: null},
    "Company" : { type: ObjectId, ref: 'Company' , default: null },
    "CompanyName" : {type: String, default: null},
    "Team" : { type: ObjectId, ref: 'Team' , default: null },
    "TeamName" : {type: String, default: null},
    "Country" : {type: String, required: true, default: "VN"},
    "Vehicle" : { type: ObjectId, ref: 'Vehicle' , default: null },
    "VehicleType" : {type: String, default: null},
    "VehicleNo" : {type: String, default: null},
    "VehicleBrand" : {type: String, default: null},
    "VehicleProvince" : {type: String, default: null},
    "QualityService" : {type: String, required: true, default: "Popular" },
    "IsLeader" : { type: Number, default: 0 },
    "Priority" : { type: Number, default: 0 },
    "IsEnable" : { type: Number, default: 1 },
    "IsActive" : { type: Number, default: 0 },
    "FromDateTime" : { type: Date, default: Date.now() },
    "ToDateTime" : { type: Date, default: null }

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'WorkingPlan' });

var Company =   require("./Company");
var Driver =   require("./Driver");
var Vehicle =   require("./Vehicle");
var Team =   require("./Team");

//modelSchema.index({CompanyID: 1, TeamID: 1,QualityService:1});

modelSchema.pre('save', function (next) {

    this.wasNew = this.isNew
    next();

})


modelSchema.post('save', function(doc) {

    var that = this
    if(that.wasNew) {

      Q.all([getDriver(doc), getCompany(doc), getTeam(doc), getVehicle(doc)])
       .spread(function (driver, company,team , vehicle){

             if( !driver || !company || !team || !vehicle)
                 return null;

             doc.DriverName = driver.Name;
             doc.CitizenID = driver.CitizenID;
             doc.CompanyName= company.Name;
             doc.TeamName= team.Name;
             doc.Country = team.Country;
             doc.VehicleNo= vehicle.No;
             doc.VehicleType= vehicle.VehicleType;
             doc.VehicleProvince= vehicle.Province;
             doc.VehicleBrand= vehicle.Brand;
             doc.save();

       });

    }
});

function getDriver(item){

  var deferred = Q.defer();

  var Driver =   require("./Driver");
  Driver.findOne({_id : item.Driver}, function(error,result){

          if (error) {
              deferred.reject(new Error(error));
          }
          else {

            deferred.resolve(result);
          }
   });

   return deferred.promise;

}

function getCompany(item){

    var deferred = Q.defer();

    Company.findOne({_id : item.Company}, function(error,result){

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
      Company.findOne({_id : item.Company}, function(error,company){

              if (error) {
                    deferred.reject(new Error(error));
              }
              else {
                    if(!company){
                        deferred.resolve(null);
                    }else {
                        Team.findOne({_id : item.Team, Company : company._id}, function(error,team){

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

function getVehicle(item){

    var deferred = Q.defer();

    Vehicle.findOne({_id : item.Vehicle}, function(error,vehicle){

            if (error) {
                deferred.reject(new Error(error));
            }
            else {
              deferred.resolve(vehicle);
            }
     });

     return deferred.promise;
}

// create model if not exists.
module.exports = mongoose.model('WorkingPlan',modelSchema);

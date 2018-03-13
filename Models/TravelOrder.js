
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var Q = require('q');
var modelSchema  = new Schema({
    "User" : { type: ObjectId, ref: 'User', default: null },
    "UserName" : {type: String, default: null},

    "OrderLoc" : { type: [Number],  index: '2d', default: []},
    "Device" : {type: String, default: null},
    "DeviceID" : {type: String, default: null},
    "Status" : { type: String, default: "Open" },
    "Currency" : { type: String, default: "VND" },

    "OrderPickupLoc" : { type: [Number],  index: '2d', default: []},
    "OrderPickupPlace" : {type: String, default: null},
    "OrderPickupCountry" : {type: String, default: 'Vietnam'},
    "OrderPickupTime" : {type: Date, default: null},
    "OrderDropLoc" : { type: [Number],  index: '2d', default: []},
    "OrderDropPlace" : {type: String, default: null},
    "OrderDuration" : { type: Number, default: null },
    "OrderDistance" : { type: Number, default: null },
    "OrderPolyline" : {type: String, default: null},
    "OrderCompanyPrice" : { type: Number, default: 0 },
    "OrderCompanyAdjust" : { type: Number, default: 0 },
    "OrderCompanyProm" : { type: Number, default: 0 },
    "OrderSysProm" : { type: Number, default: 0 },
    "OrderPrice" : { type: Number, default: 0 },
    "OrderVehicleType" : { type: String, default: null },
    "OrderQuality" : { type: String, default: 'Popular' },
    "OrderDropRestrict" : { type: Number, default: 0 },

    "ActPickupLoc" : { type: [Number],  index: '2d', default: []},
    "ActPickupPlace" : {type: String, default: null},
    "ActPickupCountry" : {type: String, default: 'Vietnam'},
    "ActPickupTime" : {type: Date, default: null},
    "ActDropLoc" : { type: [Number],  index: '2d', default: []},
    "ActDropPlace" : {type: String, default: null},
    "ActDropTime" : {type: Date, default: null},
    "ActDistance" : { type: Number, default: null },
    "ActPolyline" : {type: String, default: null},
    "ActCompanyPrice" : { type: Number, default: null },
    "ActCompanyAdjust" : { type: Number, default: null },
    "ActCompanyProm" : { type: Number, default: null },
    "ActSysProm" : { type: Number, default: null },
    "ActPrice" : { type: Number, default: null },

    "MembersQty" : {type: Number, default: 1},

    "IsMateHost" : {type: Number, default: 0},
    "MateStatus" : { type: String, default: null },
    "MateHostOrder" : { type: ObjectId, ref: 'TravelOrder', default: null },
    "MinSubMembers" : {type: Number, default: 1},
    "MaxSubMembers" : {type: Number, default: 1},
    "MateSubMembers" : {type: Number, default: 0},
    "MateSubWeight" : {type: Number, default: 0},

    "HostPoints" : { type: [Number], default: []},
    "HostPolyline" : {type: String, default: null},
    "HostOrderDistance" : { type: Number, default: null },
    "HostOrderPrice" : {type: Number, default: 0},
    "MateOrderPrice" : {type: Number, default: 0},
    "MateOrderDistance" : {type: Number, default: 0},
    "MateActPrice" : {type: Number, default: 0},


    "MustPay" : { type: Number, default: null },
    "PayMethod" : {type: String, default: null},
    "PayCurrency" : {type: String, default: null},
    "PayAmount" : { type: Number, default: null },
    "BusinessCard" : { type: ObjectId, ref: 'BusinessCard' , default: null},
    "UserPayCard" : { type: ObjectId, ref: 'UserPayCard' , default: null},
    "PayTransNo" : {type: String, default: null},
    "PayTransDate" : {type: Date, default: null},
    "PayVerifyCode" : {type: String, default: null},
    "IsVerified" : {type: Number, default: 0},
    "IsPayTransSucceed" : {type: Number, default: 0},
    "IsPaid" : {type: Number, default: 0},
    "IsPaidReconcile" : { type: Number, default: 0 },

    "Driver" : { type: ObjectId, ref: 'Driver' , default: null},
    "DriverName" : {type: String, default: null},
    "WorkingPlan" : { type: ObjectId, ref: 'WorkingPlan', default: null },
    "CitizenID" : {type: String, default: null},
    "Company" : { type: ObjectId, ref: 'Company', default: null },
    "CompanyName" : {type: String, default: null},
    "Team" : { type: ObjectId, ref: 'Team' , default: null },
    "TeamName" : {type: String, default: null},
    "Vehicle" : { type: ObjectId, ref: 'Vehicle' , default: null},
    "VehicleType" : { type: String, default: null },
    "VehicleNo" : {type: String, default: null},
    "VehicleBrand" : {type: String, default: null},
    "QualityService" : {type: String, default:  "Popular" },
    "Rating" : { type: Number, default: 0 },
    "Comment" : {type: String, default: null}

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'TravelOrder' });

var DriverStatus     =   require("./DriverStatus");
var DriverBidding     =   require("./DriverBidding");

modelSchema.index({Status :1 , ActDropLoc:1});

modelSchema.pre('save', function (next) {

  var that = this


      if(that.OrderLoc == null || (typeof that.OrderLoc === "undefined" )|| (Array.isArray(that.OrderLoc) && 0 === that.OrderLoc.length)) {
        that.OrderLoc = [];
      }

      if(that.OrderPickupLoc == null || (typeof that.OrderPickupLoc === "undefined" )|| (Array.isArray(that.OrderPickupLoc) && 0 === that.OrderPickupLoc.length)) {
        that.OrderPickupLoc = [];
      }

      if(that.OrderDropLoc == null || (typeof that.OrderDropLoc === "undefined" )|| (Array.isArray(that.OrderDropLoc) && 0 === that.OrderDropLoc.length)) {
        this.OrderDropLoc = [];
      }

      if(that.ActPickupLoc == null || (typeof that.ActPickupLoc === "undefined" )|| (Array.isArray(that.ActPickupLoc) && 0 === that.ActPickupLoc.length)) {
        that.ActPickupLoc = [];
      }

      if(that.ActDropLoc == null || (typeof that.ActDropLoc === "undefined" )|| (Array.isArray(that.ActDropLoc) && 0 === that.ActDropLoc.length)) {
        this.ActDropLoc = [];
      }




  next();
});



modelSchema.post('save', function(doc) {

    var that = this
    if(doc.Driver == null && doc.DriverName != null){

              doc.WorkingPlan = null;
              doc.DriverName = null;
              doc.CitizenID = null;
              doc.Company = null;
              doc.CompanyName = null;
              doc.Team = null;
              doc.TeamName = null;
              doc.Vehicle = null;
              doc.VehicleNo = null;
              doc.VehicleBrand = null;
              doc.QualityService = null;
              doc.save();

    }else if(doc.Driver != null && doc.User != null && (doc.WorkingPlan == null || doc.UserName == null)){

      Q.all([getUser(doc), getDriverStatus(doc)])
       .spread(function (user, driverStatus){

             if( !user && !driverStatus)
                 return null;

             if(user){
                doc.UserName = user.Name;
             }
             if(driverStatus){
               doc.WorkingPlan = driverStatus.WorkingPlan;
               doc.DriverName = driverStatus.DriverName;
               doc.CitizenID = driverStatus.CitizenID;
               doc.Company = driverStatus.Company;
               doc.CompanyName = driverStatus.CompanyName;
               doc.Team = driverStatus.Team;
               doc.TeamName = driverStatus.TeamName;
               doc.Country = driverStatus.Country;
               doc.Vehicle = driverStatus.Vehicle;
               doc.VehicleNo = driverStatus.VehicleNo;
               doc.VehicleBrand = driverStatus.VehicleBrand;
               doc.QualityService = driverStatus.QualityService;
             }
             doc.save();
       });

    }
});

modelSchema.post('remove', function(doc) {
  DriverBidding.remove({TravelOrder:this._id},function(err){});
});

function getDriverStatus(item){

  var deferred = Q.defer();

  var DriverStatus =   require("./DriverStatus");
  DriverStatus.findOne({Driver: item.Driver},function(error,result){

          if (error) {
              deferred.reject(new Error(error));
          }
          else {

            deferred.resolve(result);
          }
   });

   return deferred.promise;

}

function getUser(item){

  var deferred = Q.defer();

  var User =   require("./User");
  User.findOne({_id : item.User}, function(error,result){

          if (error) {
              deferred.reject(new Error(error));
          }
          else {

            deferred.resolve(result);
          }
   });

   return deferred.promise;

}

// create model if not exists.
module.exports = mongoose.model('TravelOrder',modelSchema);

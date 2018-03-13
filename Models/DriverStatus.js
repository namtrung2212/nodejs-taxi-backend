
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Driver" : { type: ObjectId, ref: 'Driver',default: null },
    "DriverName" : {type: String,default: null},
    "CitizenID" : {type: String,default: null},
    "PhoneNo" : {type: String,trim: true,default: null},
    "WorkingPlan" : { type: ObjectId, ref: 'WorkingPlan',default: null },
    "Company" : { type: ObjectId, ref: 'Company' , default: null },
    "CompanyName" : {type: String,default: null},
    "Team" : { type: ObjectId, ref: 'Team' , default: null },
    "TeamName" : {type: String,default: null},
    "Country" : {type: String, required: true, default: "VN"},
    "Vehicle" : { type: ObjectId, ref: 'Vehicle' , default: null },
    "VehicleType" : {type: String,default: null},
    "VehicleNo" : {type: String,default: null},
    "VehicleBrand" : {type: String,default: null},
    "VehicleProvince" : {type: String,default: null},
    "QualityService" : {type: String, required: true, default: "Popular" },
    "DriverSetting" : { type: ObjectId, ref: 'DriverSetting' ,default: null},
    "Location" : { type: [Number],  index: '2d',default: []},
    "Address" : {type: String,default: null},
    "Degree" : { type: Number, default: 0 },
    "Speed" : { type: Number, default: 0 },
    "FCMToken" : {type: String,default: null},

    "IsActivated" : {type: Number, default: 0},
    "ActivatedDate" : {type: Date, default: null},
    "AutoLockChangeDate" : {type: Date, default: null},
    "IsLocked" : {type: Number, default: 0},
    "LockChangedDate" : {type: Date, default: null},
    "LockedReason" : {type: String, default: null},

    "LastLogin" : {type: Date,default: null},
    "LastOnline" : {type: Date,default: null},
    "IsOnline" : { type: Number, default: 0 },
    "IsReady" :  { type: Number, default: 0 },
    "IsVehicleTaken" : { type: Number, default: 0 },
    "MonthlyLocation" : { type: [Number],  index: '2d',default: []},
    "MonthlyDistance" : { type: Number, default: 0 },
    "Rating" : { type: Number, default: 0 },
    "RateCount" : { type: Number, default: 0 },
    "ServedQty" : { type: Number, default: 0 },
    "VoidedBfPickupByDriver" : { type: Number, default: 0 },
    "VoidedBfPickupByUser" : { type: Number, default: 0 },
    "VoidedAfPickupByDriver" : { type: Number, default: 0 },
    "VoidedAfPickupByUser" : { type: Number, default: 0 }

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'DriverStatus' });


//modelSchema.index({Location:1 , QualityService:1 , VehicleType:1 , IsReady: 1};


modelSchema.pre('save', function (next) {
  if (this.isNew){
      if(Array.isArray(this.Location) && 0 === this.Location.length) {
        this.Location = undefined;
      }
      if(Array.isArray(this.MonthlyLocation) && 0 === this.MonthlyLocation.length) {
        this.MonthlyLocation = undefined;
      }
  }

  next();
})



// create model if not exists.
module.exports = mongoose.model('DriverStatus',modelSchema);

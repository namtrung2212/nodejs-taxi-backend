
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Vehicle" : { type: ObjectId, ref: 'Vehicle' , default: null},
    "VehicleType" : {type: String, default: null},
    "VehicleNo" : {type: String, default: null},
    "VehicleBrand" : {type: String, default: null},
    "VehicleProvince" : {type: String, default: null},
    "QualityService" : {type: String, required: true, default: "Popular" },
    "Company" : { type: ObjectId, ref: 'Company' , default: null },
    "CompanyName" : {type: String, default: null},
    "Team" : { type: ObjectId, ref: 'Team' , default: null },
    "TeamName" : {type: String, default: null},
    "Country" : {type: String, required: true, default: "VN"},
    "Driver" : { type: ObjectId, ref: 'Vehicle' , default: null },
    "DriverName" : {type: String, default: null},
    "CitizenID" : {type: String, default: null},
    "DriverCount" :  { type: Number, default: 0 },
    "Location" :  { type: [Number] , index: '2d', default: []},
    "Address" : {type: String, default: null},
    "Degree" : { type: Number, default: 0 },
    "Speed" : { type: Number, default: 0 },
    "IsInUse" :  { type: Number, default: 0 },
    "IsDriving" :  { type: Number, default: 0 },
    "MonthlyLocation" : { type: [Number],  index: '2d', default: []},
    "MonthlyDistance" : { type: Number, default: 0 },
    "TaxiOrderCount" : { type: Number, default: 0 }

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'VehicleStatus' });


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
module.exports = mongoose.model('VehicleStatus',modelSchema);

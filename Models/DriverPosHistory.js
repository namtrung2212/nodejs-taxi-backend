
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
  "Driver" : { type: ObjectId, ref: 'Driver' ,default: null},
  "WorkingPlan" : { type: ObjectId, ref: 'WorkingPlan' ,default: null},
  "Company" : { type: ObjectId, ref: 'Company' , default: null },
  "Team" : { type: ObjectId, ref: 'Team' , default: null },
  "Country" : {type: String, required: true, default: "VN"},
  "Vehicle" : { type: ObjectId, ref: 'Vehicle' , default: null },
  "VehicleType" : {type: String,default: null},
  "Location" : { type: [Number],  index: '2d',default: []},
  "Address" : {type: String,default: null},
  "Degree" : { type: Number, default: 0 },
  "Speed" : { type: Number, default: 0 },
  "DeviceID" : {type: String,default: null},
  "Device" : {type: String,default: null}

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'DriverPosHistory' });


//modelSchema.index({CompanyID:1 , TeamID:1 , DriverID:1 , createdAt: 1};

var DriverStatus     =   require("./DriverStatus");
var VehicleStatus     =   require("./VehicleStatus");
var WorkingPlan     =   require("./WorkingPlan");


modelSchema.pre('save', function (next) {

  var that = this

  if (that.isNew){

      if(Array.isArray(that.Location) && 0 === that.Location.length) {
        that.Location = undefined;
      }

      DriverStatus.findOne({Driver: that.Driver},function(err,obj){

        if(obj){
            that.WorkingPlan = obj.WorkingPlan;
            that.Company = obj.Company;
            that.Team = obj.Team;
            that.Country = obj.Country;
            that.Vehicle = obj.Vehicle;
            that.VehicleType = obj.VehicleType;
        }
        next();

      });

  }else{

      next();

  }
})

modelSchema.post('save', function(doc) {

        DriverStatus.findOneAndUpdate({Driver: doc.Driver},
                                    {
                                        Location:doc.Location,
                                        Address:doc.Address,
                                        Degree:doc.Degree,
                                        Speed:doc.Speed,
                                        LastOnline:new Date(),
                                        IsOnline:1
                                    },function(err, numberAffected, raw){

                                    });

        VehicleStatus.findOneAndUpdate({Vehicle: doc.Vehicle},
                                    {
                                        Location:doc.Location,
                                        Address:doc.Address,
                                        Degree:doc.Degree,
                                        Speed:doc.Speed,
                                        LastOnline:new Date(),
                                        IsDriving:1
                                    },function(err, numberAffected, raw){

                                    });
});

// create model if not exists.
module.exports = mongoose.model('DriverPosHistory',modelSchema);

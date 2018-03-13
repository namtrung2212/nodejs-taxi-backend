var Promise = require('promise');
var Q = require('q');
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({

  "Name" : {type: String, required: true,default: null},
  "Birthday" : {type: Date, required: true,default: null},
  "CitizenID" : {type: String,trim: true,required: true,default: null},
  "CitizenIDDate" : {type: Date,default: null},
  "Country" : {type: String,trim: true, required: true, default: "VN"},
  "Province" : {type: String,trim: true, required: true,default: null},
  "Gender" : {type: String,  enum: ['Male', 'Female'],default: null},
  "PhoneNo" : {type: String,trim: true,required: true,default: null},
  "EmailAddr" : {type: String,default: null, match: /\S+@\S+\.\S+/} ,
  "DriverSetting" : { type: ObjectId, ref: 'DriverSetting' ,default: null},
  "DriverStatus" : { type: ObjectId, ref: 'DriverStatus',default: null }
  
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'Driver' });

modelSchema.index({ Country: 1, CitizenID: 1}, { unique: true });

var DriverSetting     =   require("./DriverSetting");
var DriverStatus     =   require("./DriverStatus");
var DriverActivity     =   require("./DriverActivity");
var DriverPosHistory     =   require("./DriverPosHistory");


modelSchema.pre('save', function (next) {

  this.wasNew = this.isNew
  var that = this
  if(that.DriverSetting == null) {

    var setting = new DriverSetting();
    setting.Driver = that._id;
    setting.save();

    var status = new DriverStatus();
    status.Driver = that._id;
    status.DriverName = that.Name;
    status.CitizenID = that.CitizenID;
    status.PhoneNo = that.PhoneNo;
    status.DriverSetting = setting._id;
    status.save();

    that.DriverSetting = setting._id;
    that.DriverStatus = status._id;

  }
  next();

});

modelSchema.post('save', function(doc) {
  var that = this


});

modelSchema.post('remove', function(doc) {
  DriverSetting.remove({Driver:this._id},function(err){});
  DriverStatus.remove({Driver:this._id},function(err){});
  DriverActivity.remove({Driver:this._id},function(err){});
  DriverPosHistory.remove({Driver:this._id},function(err){});

});

//modelSchema.index({Gender:1 ,YearOlds:1 ,Country:1 ,  ActiveCompanyID:1 , ActiceTeamID:1 });

// create model if not exists.
module.exports = mongoose.model('Driver',modelSchema);

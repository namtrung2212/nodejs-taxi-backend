
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Driver" : { type: ObjectId, ref: 'Driver',default: null} ,
    "Language" : { type: String, default: "Vietnamese"},
    "Currency" : { type: String, default: "VND"},
    "DeviceID" : {type: String,default: null},
    "Device" : {type: String,default: null},
    "IsVerified" :  { type: Number, default: 0 },
    "VerifiedDate" :  { type: Date, default: null }
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'DriverSetting' });


modelSchema.index({Language:1  , Device:1 , IsVerified:1});

module.exports = mongoose.model('DriverSetting',modelSchema);

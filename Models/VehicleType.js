var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Country" : {type: String,trim: true, required: true, default: "VN"},
    "Name" : {type: String, required: true,default: null},
    "LocaleName" : {type: String,default: null},
    "IsCar" : { type: Number, default: 0},
    "IsTaxi" : { type: Number, default: 1},
    "IsBike" : { type: Number, default: 0},
    "EffectDateFrom" : { type: Date, default: new Date()},
    "EffectDateTo" : { type: Date, default: null},
    "IsEnable" : { type: Number, default: 1},
    "IsActive" : { type: Number, default: 0}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'VehicleType' });

module.exports = mongoose.model('VehicleType',modelSchema);

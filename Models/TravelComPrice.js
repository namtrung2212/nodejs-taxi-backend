
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Company" : { type: ObjectId, ref: 'Company', default: null },
    "Team" : { type: ObjectId, ref: 'Team', default: null },
    "Country" : { type: String, default: "VN"},
    "PickupCenterLoc" : { type: [Number],  index: '2d', default: []},
    "PickupRadian" : { type: Number, default: 0},
    "VehicleType" : {type: String,default: null},
    "QualityService" : { type: String, default: "Popular"},
    "Priority" : { type: Number, default: 0},
    "IsEnable" : { type: Number, default: 1},
    "IsActive" : { type: Number, default: 0},
    "EffectDateFrom" : { type: Date, default: new Date()},
    "EffectDateTo" : { type: Date, default: null},
    "TimeInDayFrom" : { type: Number, default: 0},
    "TimeInDayTo" : { type: Number, default: 24},
    "FromKm" : { type: Number, default: 0},
    "Currency" : { type: String, default: "VND"},
    "OpenningPrice" : { type: Number, default: 0},
    "PricePerKm" : { type: Number, default: 0}

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'TravelComPrice' });


modelSchema.index({PickupCenterLoc :1});
// create model if not exists.
module.exports = mongoose.model('TravelComPrice',modelSchema);

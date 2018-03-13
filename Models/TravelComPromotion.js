

var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;


var modelSchema  = new Schema({
    "Country" : {type: String,trim: true, required: true, default: "VN"},
    "Company" : { type: ObjectId, ref: 'Company', default: null },
    "Team" : { type: ObjectId, ref: 'Team', default: null },
    "PickupCenterLoc" : { type: [Number],  index: '2d', default: []},
    "PickupRadian" : { type: Number, default: 0},
    "VehicleType" : {type: String,default: null},
    "QualityService" : {type: String,default: null},
    "Priority" : {type: Number,default: 0},
    "IsEnable" : { type: Number, default: 1},
    "IsActive" : { type: Number, default: 1},
    "EffectDateFrom" : { type: Date, default: new Date()},
    "EffectDateTo" : { type: Date, default: null},
    "TimeInDayFrom" : { type: Number, default: 0},
    "TimeInDayTo" : { type: Number, default: 24},
    "MinServedQty" : { type: Number, default: 0},
    "MaxServedQty" : { type: Number, default: 5},
    "FromKm" : { type: Number, default: 0},
    "PromotePct" : { type: Number, default: 0},
    "FixedAmtPerKm" : { type: Number, default: 0},
    "Currency" : { type: String, default: "VND"}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'TravelComPromotion' });


modelSchema.index({PickupCenterLoc :1});
// create model if not exists.
module.exports = mongoose.model('TravelComPromotion',modelSchema);

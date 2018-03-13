
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Name" : {type: String,unique: true, required: true,default: null},
    "Address" : {type: String, required: true,default: null},
    "Hotline" : {type: Number, required: true,default: null},
    "Country" : {type: String, required: true, default: "VN"},
    "Rating" : { type: Number, default: 0 },
    "RateCount" : { type: Number, default: 0 },
    "ServedQty" : { type: Number, default: 0 },
    "VoidedBfPickupByDriver" : { type: Number, default: 0 },
    "VoidedBfPickupByUser" : { type: Number, default: 0 },
    "VoidedAfPickupByDriver" : { type: Number, default: 0 },
    "VoidedAfPickupByUser" : { type: Number, default: 0 }
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'Company' });


modelSchema.index({ Country: 1, Name: 1}, { unique: true });

// create model if not exists.
module.exports = mongoose.model('Company',modelSchema);

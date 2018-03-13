
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({

    "Name" : {type: String, required: true, default: null },
    "Leader" : { type: ObjectId, ref: 'Driver', default: null },
    "Hotline" : {type: String, required: true, default: null},
    "Company" : { type: ObjectId, ref: 'Company' , default: null},
    "Country" : {type: String, required: true, default: "VN"},
    "Rating" : { type: Number, default: 0 },
    "RateCount" : { type: Number, default: 0 },
    "ServedQty" : { type: Number, default: 0 },
    "VoidedBfPickupByDriver" : { type: Number, default: 0 },
    "VoidedBfPickupByUser" : { type: Number, default: 0 },
    "VoidedAfPickupByDriver" : { type: Number, default: 0 },
    "VoidedAfPickupByUser" : { type: Number, default: 0 }
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'Team' });


modelSchema.index({ Country: 1, Company: 1,Name:1}, { unique: true });

// create model if not exists.
module.exports = mongoose.model('Team',modelSchema);

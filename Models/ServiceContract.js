
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Name" : {type: String,default: null},
    "Address" : {type: String,default: null},
    "Hotline" : {type: String,default: null},

    "Country" : {type: String, required: true, default: "VN"},
    "Rating" : { type: Number, default: 0 },
    "RateCount" : { type: Number, default: 0 },
    "ServedQty" : { type: Number, default: 0 }
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'ServiceContract' });


// create model if not exists.
module.exports = mongoose.model('ServiceContract',modelSchema);


var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Name" : String,
    "Address" : String,
    "Hotline" : String,
    "Country" : String,
    "LogoID" : ObjectId,
    "Rating" : { type: Number, default: 0 },
    "RateCount" : { type: Number, default: 0 },
    "ServedQty" : { type: Number, default: 0 }
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'Company' });


// create model if not exists.
module.exports = mongoose.model('Company',modelSchema);

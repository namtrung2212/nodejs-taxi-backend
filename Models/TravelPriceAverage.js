
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;


var modelSchema  = new Schema({
    "Country" : {type: String, required: true, default: "VN"},
    "VehicleType" : {type: String,default: null},
    "QualityService" : { type: String, default: "Popular"},
    "Currency" : { type: String, default: "VND"},
    "PricePerKm" : { type: Number, default: 0},
    "OpenningPrice" : { type: Number, default: 0}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'TravelPriceAverage' });


//modelSchema.index({Country: 1};

// create model if not exists.
module.exports = mongoose.model('TravelPriceAverage',modelSchema);

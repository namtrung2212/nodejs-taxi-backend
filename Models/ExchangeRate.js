
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "SourceCurry" : {type: String,default: null},
    "DestCurry" : { type: String, default: "VND"},
    "ExRate" : { type: Number, default: 1},
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'ExchangeRate' });


// create model if not exists.
module.exports = mongoose.model('ExchangeRate',modelSchema);

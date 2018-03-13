
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({

    "TravelOrder" : { type: ObjectId, ref: 'TravelOrder',default: null },
    "Driver" : { type: ObjectId, ref: 'Driver' ,default: null},
    "Team" : { type: ObjectId, ref: 'Team' ,default: null},
    "Company" : { type: ObjectId, ref: 'Company' ,default: null},
    "User" : { type: ObjectId, ref: 'User',default: null },
    "Comment" : {type: String,default: null}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'OrderComment' });


// create model if not exists.
module.exports = mongoose.model('OrderComment',modelSchema);

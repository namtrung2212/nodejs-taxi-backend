
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "User" : { type: ObjectId, ref: 'User' },
    "Location" : { type: [Number],  index: '2dsphere'},
    "Content" : {type: String},
    "Images" : {type: [ObjectId]}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'UserPost' });

modelSchema.index({User:1  , createdAt:1 });

module.exports = mongoose.model('UserPost',modelSchema);

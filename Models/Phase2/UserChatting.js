
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "User1" : { type: ObjectId, ref: 'User' },
    "User2" : { type: ObjectId, ref: 'User' },
    "Presenter" : { type: ObjectId, ref: 'User' },
    "Content" : {type: String},
    "Images" : {type: [ObjectId]}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'UserChatting' });

modelSchema.index({User1:1  , User2:1 });
modelSchema.index({User2:1  , User1:1 });

module.exports = mongoose.model('UserChatting',modelSchema);

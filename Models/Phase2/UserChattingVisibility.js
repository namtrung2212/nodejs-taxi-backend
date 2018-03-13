
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "UserChatting" : { type: ObjectId, ref: 'UserChatting' },
    "User" : { type: ObjectId, ref: 'User' }
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'UserChattingVisibility' });

modelSchema.index({User:1});

module.exports = mongoose.model('UserChattingVisibility',modelSchema);

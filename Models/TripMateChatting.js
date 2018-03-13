
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var Q = require('q');
var modelSchema  = new Schema({

    "HostOrder" : { type: ObjectId, ref: 'TravelOrder' , default: null},
    "UserOrder" : { type: ObjectId, ref: 'TravelOrder' , default: null},
    "User" : { type: ObjectId, ref: 'User', default: null },
    "UserName" : {type: String, default: null},

    "IsViewedList" : { type: [ObjectId], default: [] },
    "Content" : {type: String, default: null},
    "ImageIDs" : {type: String, default: null},
    "Location" : { type: [Number],  index: '2d', default: []}

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'TripMateChatting' });

modelSchema.pre('save', function (next) {

  var that = this

  if (that.isNew){

  }


  next();
})



modelSchema.post('save', function(doc) {

    var that = this
});



// create model if not exists.
module.exports = mongoose.model('TripMateChatting',modelSchema);

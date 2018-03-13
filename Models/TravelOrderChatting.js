
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var Q = require('q');
var modelSchema  = new Schema({

    "Order" : { type: ObjectId, ref: 'TravelOrder' , default: null},
    "User" : { type: ObjectId, ref: 'User', default: null },
    "UserName" : {type: String, default: null},

    "Driver" : { type: ObjectId, ref: 'Driver' , default: null},
    "DriverName" : {type: String, default: null},
    "CitizenID" : {type: String, default: null},

    "Vehicle" : { type: ObjectId, ref: 'Vehicle' , default: null},
    "VehicleType" : { type: String, default: null },
    "VehicleNo" : {type: String, default: null},

    "IsUser" : { type: Number, default: 0 },
    "IsViewed" : { type: Number, default: 0 },
    "Content" : {type: String, default: null},
    "ImageIDs" : {type: String, default: null},
    "Location" : { type: [Number],  index: '2d', default: []}

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'TravelOrderChatting' });


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
module.exports = mongoose.model('TravelOrderChatting',modelSchema);


var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({

    "Notification" : { type: ObjectId, ref: 'Notification' , default: null },
    "Driver" : { type: ObjectId, ref: 'Driver' ,default: null},
    "User" : { type: ObjectId, ref: 'User',default: null }

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'NotificationViewed' });

modelSchema.pre('save', function (next) {
  if (this.isNew){


  }

  next();
})

modelSchema.post('save', function(doc) {

});


module.exports = mongoose.model('NotificationViewed',modelSchema);

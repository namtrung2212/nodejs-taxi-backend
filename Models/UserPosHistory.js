
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "User" : { type: ObjectId, ref: 'User' , default: null },
    "Location" : { type: [Number],  index: '2d', default: []},
    "Address" : {type: String, default: null},
    "Speed" : { type: Number, default: 0 },
    "DeviceID" : {type: String, default: null},
    "Device" : {type: String, default: null}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'UserPosHistory' });


//modelSchema.index({User._id:1 , Location:1 });

var UserStatus     =   require("./UserStatus");

modelSchema.pre('save', function (next) {
  var that = this
  if (that.isNew){
      if(Array.isArray(that.Location) && 0 === that.Location.length) {
        that.Location = undefined;
      }
  }

  UserStatus.findOneAndUpdate({User: that.User},
                              {
                                  Location:that.Location,
                                  Address:that.Address,
                                  Speed:that.Speed,
                                  LastOnline:new Date(),
                                  IsOnline:1
                              },function(err, numberAffected, raw){
                                console.log(err)
                              });
  next();
})

modelSchema.post('save', function(doc) {


});


module.exports = mongoose.model('UserPosHistory',modelSchema);

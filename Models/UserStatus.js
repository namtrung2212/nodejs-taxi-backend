
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "User" : { type: ObjectId, ref: 'User', default: null },
    "UserSetting" : { type: ObjectId, ref: 'UserSetting', default: null },
    "Location" :  { type: [Number] , index: '2d', default: []},
    "Address" : {type: String, default: null},
    "Speed" : { type: Number, default: 0 },
    "FCMToken" : {type: String,default: null},

    "IsActivated" : {type: Number, default: 0},
    "ActivatedDate" : {type: Date, default: null},
    "AutoLockChangeDate" : {type: Date, default: null},
    "IsLocked" : {type: Number, default: 0},
    "LockChangedDate" : {type: Date, default: null},
    "LockedReason" : {type: String, default: null},

    "LastLogin" :  { type: Date, default: null },
    "LastOnline" :  { type: Date, default: null },
    "IsOnline" : { type: Number, default: 0 },

    "MonthlyLocation" : { type: [Number] , index: '2d', default: []},
    "MonthlyDistance" : { type: Number, default: 0 },

    "ServedQty" : { type: Number, default: 0 },
    "VoidedBfPickupByDriver" : { type: Number, default: 0 },
    "VoidedBfPickupByUser" : { type: Number, default: 0 },
    "VoidedAfPickupByDriver" : { type: Number, default: 0 },
    "VoidedAfPickupByUser" : { type: Number, default: 0 }

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'UserStatus' });

modelSchema.pre('save', function (next) {
  if (this.isNew){
      if(Array.isArray(this.Location) && 0 === this.Location.length) {
        this.Location = undefined;
      }
      if(Array.isArray(this.MonthlyLocation) && 0 === this.MonthlyLocation.length) {
        this.MonthlyLocation = undefined;
      }
  }

  next();
})

//modelSchema.index({IsOnline:1 , Location:1 });

module.exports = mongoose.model('UserStatus',modelSchema);

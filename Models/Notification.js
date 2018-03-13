
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({

    "NotifyType" : {type: String, default: null},
    "ExpireTime" : {type: Date,default: null},
    "FromCompany" : { type: ObjectId, ref: 'Company' , default: null },
    "FromTeam" : { type: ObjectId, ref: 'Team' , default: null },
    "FromDriver" : { type: ObjectId, ref: 'Driver' ,default: null},
    "FromBusiness" : { type: ObjectId, ref: 'Business' , default: null },
    "FromUser" : { type: ObjectId, ref: 'User',default: null },

    "ToCompanyDriver" : { type: ObjectId, ref: 'Company' , default: null },
    "ToTeamDriver" : { type: ObjectId, ref: 'Team' , default: null },
    "ToVehicleType" : {type: String,default: null},
    "ToQualityService" : {type: String, required: true, default: "Popular" },
    "ToDriver" : { type: ObjectId, ref: 'Driver' ,default: null},
    "ToLocationDriver" : { type: [Number],  index: '2d', default: []},
    "LocationRadian" : { type: Number, default: 0},
    "ToUserInBusiness" : { type: ObjectId, ref: 'Business' , default: null },
    "ToUser" : { type: ObjectId, ref: 'User',default: null },

    "Content" : {type: String,trim: true, default: null},
    "IsViewed" : { type: Number, default: 0 },

    "Order" : { type: ObjectId, ref: 'TravelOrder',default: null },
    "BusinessAccount" : { type: ObjectId, ref: 'BusinessAccount',default: null },
    "BusinessCard" : { type: ObjectId, ref: 'BusinessCard',default: null }



}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'Notification' });

modelSchema.pre('save', function (next) {
  if (this.isNew){


  }

  next();
})

modelSchema.post('save', function(doc) {

});


module.exports = mongoose.model('Notification',modelSchema);

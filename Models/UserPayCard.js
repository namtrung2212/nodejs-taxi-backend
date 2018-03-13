
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({

    "User" : { type: ObjectId, ref: 'User', required: true , default: null },
    "Currency" : {type: String,required: true, default: 'VND'},

    "Bank" : {type: String, default: null},
    "BankAcc" : {type: String, default: null},
    "BankAccOwner" : {type: String, default: null},
    "CardType" : {type: String, default: null},
    "CardNo" : {type: String, default: null},
    "CardExpireDate" : {type: Date, default: null},
    "SecurityCode" : {type: String, default: null},

    "IsVerified" : {type: Number, default: 0},
    "IsExpired" : {type: Number, default: 0},
    "IsLocked" : {type: Number, default: 0}

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'UserPayCard' });


modelSchema.pre('save', function (next) {
  if (this.isNew){


  }

  next();
})

modelSchema.post('save', function(doc) {

});


module.exports = mongoose.model('UserPayCard',modelSchema);

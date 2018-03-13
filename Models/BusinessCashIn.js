
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({

    "Account" : { type: ObjectId, ref: 'BusinessAccount', required: true , default: null },
    "AccountNo" : {type: String,required: true, default: null},
    "AccountOwner" : { type: ObjectId, ref: 'Business', required: true , default: null },
    "Currency" : {type: String,required: true, default: 'VND'},

    "RefFIDocNo" : {type: String, default: null},
    "RefFIDocDesc" : {type: String, default: null},
    "RefFIDocDate" : {type: Date, default: null},

    "OurBank" : {type: String, default: null},
    "OurBankAcc" : {type: String, default: null},

    "PartnerBank" : {type: String, default: null},
    "PartnerAcc" : {type: String, default: null},
    "PartnerAccOwner" : {type: String, default: null},
    "PartnerTransNo" : {type: String, default: null},
    "PartnerTransDesc" : {type: String, default: null},
    "PartnerTransDate" : {type: Date, default: null},

    "EmbededTransferUser" : { type: ObjectId, ref: 'User' , default: null },
    "EmbededPayCard" : { type: ObjectId, ref: 'UserPayCard' , default: null },
    "EmbededCardNo" : {type: String, default: null},
    "EmbededCardExpireDate" : {type: Date, default: null},
    "EmbededVerifyCode" : {type: String, default: null},

    "IsVerified" : {type: Number, default: 0},
    "IsSucceed" : {type: Number, default: 0},

    "ReceiveCash" : {type: Number,default: 0},
    "ReceivedDate" : {type: Date, default: null},
    "IsReceived" : {type: Number, default: 0}

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'BusinessCashIn' });


modelSchema.pre('save', function (next) {
  if (this.isNew){


  }

  next();
})

modelSchema.post('save', function(doc) {

});


module.exports = mongoose.model('BusinessCashIn',modelSchema);

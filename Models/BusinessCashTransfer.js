
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({

    "SourceAccount" : { type: ObjectId, ref: 'BusinessAccount', required: true , default: null },
    "SourceAccountNo" : {type: String,required: true, default: null},
    "SourceAccountOwner" : { type: ObjectId, ref: 'Business', required: true , default: null },
    "Currency" : {type: String,required: true, default: 'VND'},

    "DestinyAccountNo" : {type: String,required: true, default: null},
    "DestinyAccount" : { type: ObjectId, ref: 'BusinessAccount', required: true , default: null },
    "DestinyAccountOwner" : { type: ObjectId, ref: 'Business', required: true , default: null },

    "RefFIDocNo" : {type: String, default: null},
    "RefFIDocDesc" : {type: String, default: null},
    "RefFIDocDate" : {type: Date, default: null},

    "PartnerTransNo" : {type: String, default: null},
    "PartnerTransDesc" : {type: String, default: null},
    "PartnerTransDate" : {type: Date, default: null},

    "TransferCash" : {type: Number,default: 0},
    "TransferedDate" : {type: Date, default: null},
    "IsTransfered" : {type: Number, default: 0}

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'BusinessCashTransfer' });


modelSchema.pre('save', function (next) {
  if (this.isNew){


  }

  next();
})

modelSchema.post('save', function(doc) {

});


module.exports = mongoose.model('BusinessCashTransfer',modelSchema);

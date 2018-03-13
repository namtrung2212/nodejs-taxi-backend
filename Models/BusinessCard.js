
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema

var modelSchema  = new Schema({

    "CardNo" : {type: String, unique: true, default: null},
    "CardOwner" : { type: ObjectId, ref: 'User' , default: null },

    "AccountOwner" : { type: ObjectId, ref: 'Business', required: true , default: null },
    "BusinessName" : {type: String, default: null},
    "Account" : { type: ObjectId, ref: 'BusinessAccount', required: true , default: null },
    "AccountNo" : {type: String, required: true, default: null},
    "Currency" : {type: String,required: true, default: 'VND'},

    "AutoActivateDate" : {type: Date, default: null},
    "IsActivated" : {type: Number, default: 0},
    "ActivatedDate" : {type: Date, default: null},

    "WillExpireDate" : {type: Date, default: null},
    "IsExpired" : {type: Date, default: 0},
    "ExpiredDate" : {type: Date, default: null},

    "AutoLockChangeDate" : {type: Date, default: null},
    "IsLocked" : {type: Number, default: 0},
    "LockChangedDate" : {type: Date, default: null},
    "LockedReason" : {type: String, default: null},

    "PaymentTotal" : {type: Number,default: 0}

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'BusinessCard' });


var AutoNumbering     =   require("./AutoNumbering");

AutoNumbering.findOne({model: 'BusinessCard', field : 'CardNo'},function(err,numbering){

      if(!numbering){
           var numbering2 = AutoNumbering();
           numbering2.model = 'BusinessCard';
           numbering2.field = 'CardNo';
           numbering2.count = 100000000;
           numbering2.save();
      }

});

modelSchema.pre('save', function (next) {

    this.wasNew = this.isNew
    var that = this

    if(that.isNew) {

                  AutoNumbering.findOneAndUpdate({model: 'BusinessCard', field : 'CardNo'}, { $inc: { count: 1 } }, {new: true}, function(err, numbering){
                      if(!err){
                          that.CardNo = numbering.count.toString();
                      }
                      next();
                  });

    }else{
        next();
    }
});

modelSchema.post('save', function(doc) {

});


module.exports = mongoose.model('BusinessCard',modelSchema);


var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

const Promise = require('bluebird');
var modelSchema  = new Schema({

    "AccountNo" : {type: String, unique: true, default: null},
    "AccountOwner" : { type: ObjectId, ref: 'Business', required: true , default: null },
    "BusinessName" : {type: String, default: null},
    "IsPersonal" : {type: Number, default: 1},
    "Currency" : {type: String,required: true, default: 'VND'},

    "Manager" : { type: ObjectId, ref: 'User' , default: null },

    "AutoActivateDate" : {type: Date, default: null},
    "IsActivated" : {type: Number, default: 0},
    "ActivatedDate" : {type: Date, default: null},

    "AutoLockChangeDate" : {type: Date, default: null},
    "IsLocked" : {type: Number, default: 0},
    "LockChangedDate" : {type: Date, default: null},
    "LockedReason" : {type: String, default: null},

    "CashInTotal" : {type: Number,default: 0},
    "CashOutTotal" : {type: Number,default: 0},
    "CashTransferInTotal" : {type: Number,default: 0},
    "CashTransferOutTotal" : {type: Number,default: 0},
    "Balance" : {type: Number,default: 0}

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'BusinessAccount' });

var AutoNumbering     =   require("./AutoNumbering");

AutoNumbering.findOne({model: 'BusinessAccount', field : 'AccountNo'},function(err,numbering){

      if(!numbering){
           var numbering2 = AutoNumbering();
           numbering2.model = 'BusinessAccount';
           numbering2.field = 'AccountNo';
           numbering2.count = 100000000;
           numbering2.save();
      }

});

modelSchema.pre('save', function (next) {

    this.wasNew = this.isNew
    var that = this

    if(that.isNew) {

                  AutoNumbering.findOneAndUpdate({model: 'BusinessAccount', field : 'AccountNo'}, { $inc: { count: 1 } }, {new: true}, function(err, numbering){
                      var prefix = (that.IsPersonal == 1) ? 'P' : 'C';
                      if(!err){
                          that.AccountNo = prefix + numbering.count.toString();
                      }
                      next();
                  });

    }else{
        next();
    }
});


modelSchema.post('save', function(doc) {
  var that = this

  if(that.wasNew) {


  }
});

module.exports = mongoose.model('BusinessAccount',modelSchema);


var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({

    "Card" : { type: ObjectId, ref: 'BusinessCard', required: true , default: null },
    "CardNo" : {type: String, required: true, default: null},
    "Account" : { type: ObjectId, ref: 'Account', required: true , default: null },
    "AccountNo" : {type: String, required: true, default: null},
    "AccountOwner" : { type: ObjectId, ref: 'Business', required: true , default: null },
    "BusinessName" : {type: String, default: null},
    "Currency" : {type: String,required: true, default: 'VND'},

    "AssignedUser" : { type: ObjectId, ref: 'User' , default: null },
    "IsOverBudget" : {type: Number, default: 0},
    "PayableAmount" : {type: Number, default: 0},

    "WeeklyBudget" : {type: Number, default: 0},
    "MonthlyBudget" : {type: Number, default: 0},
    "QuarterlyBudget" : {type: Number, default: 0},
    "YearlyBudget" : {type: Number, default: 0},

    "CurrentWeekFrom" : {type: Date, default: null},
    "CurrentWeekTo" : {type: Date, default: null},
    "CurrentMonth" : {type: Number, default: null},
    "CurrentQuarter" : {type: Number, default: null},
    "CurrentYear" : {type: Number, default: null},

    "PaidCurrentWeek" : {type: Number, default: 0},
    "PaidCurrentMonth" : {type: Number, default: 0},
    "PaidCurrentQuarter" : {type: Number, default: 0},
    "PaidCurrentYear" : {type: Number, default: 0},

    "AutoActivateDate" : {type: Date, default: null},
    "IsActivated" : {type: Number, default: 0},
    "ActivatedDate" : {type: Date, default: null},

    "WillExpireDate" : {type: Date, default: null},
    "IsExpired" : {type: Date, default: 0},
    "ExpiredDate" : {type: Date, default: null},

    "AutoLockChangeDate" : {type: Date, default: null},
    "IsLocked" : {type: Number, default: 0},
    "LockChangedDate" : {type: Date, default: null},
    "LockedReason" : {type: String, default: null}

}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'BusinessCardBudget' });


modelSchema.pre('save', function (next) {
  if (this.isNew){


  }

  next();
})

modelSchema.post('save', function(doc) {

});


module.exports = mongoose.model('BusinessCardBudget',modelSchema);

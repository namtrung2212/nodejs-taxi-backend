var mongoose    =   require("mongoose");

var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Name" : {type: String, default: null},
    "Birthday" : {type: Date, default: null},
    "CitizenID" : {type: String,trim: true,default: null},
    "CitizenIDDate" : {type: Date,default: null},
    "Country" : {type: String, default: "VN"},
    "Province" : {type: String, default: null},
    "Gender" : {type: String,  enum: ['Male', 'Female',null], default: null},
    "PhoneNo" : {type: String,trim: true,required: true, default: null},
    "EmailAddr" : {type: String, match: /\S+@\S+\.\S+/, default: null} ,
    "UserSetting" : { type: ObjectId, ref: 'UserSetting' , default: null},
    "UserStatus" : { type: ObjectId, ref: 'UserStatus' , default: null}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'User' });

modelSchema.index({ Country: 1, PhoneNo: 1}, { unique: true });

var UserSetting     =   require("./UserSetting");
var UserStatus     =   require("./UserStatus");
var UserActivity     =   require("./UserActivity");
var UserPosHistory     =   require("./UserPosHistory");

var Business     =   require("./Business");
var BusinessAccount     =   require("./BusinessAccount");
var BusinessCard     =   require("./BusinessCard");
var BusinessCardBudget     =   require("./BusinessCardBudget");


modelSchema.pre('save', function (next) {

    this.wasNew = this.isNew

    var that = this

    next();

});

modelSchema.post('save', function(doc) {
  var that = this

  if(that.wasNew) {

    var setting = new UserSetting();
    setting.User = doc._id;
    setting.save();

    var status = new UserStatus();
    status.User = doc._id;
    status.UserSetting = setting._id;
    status.save();

    var business = new Business();
    business.Represent = doc._id;
    business.PersonName = doc.Name;
    business.PersonBirthday = doc.Birthday;
    business.PersonCitizenID = doc.CitizenID;
    business.PersonCitizenIDDate = doc.CitizenIDDate;
    business.PersonCountry = doc.Country;
    business.PersonProvince = doc.Province;
    business.PersonGender = doc.Gender;
    business.PersonPhoneNo = doc.PhoneNo;
    business.PersonEmailAddr = doc.EmailAddr;
    business.PersonAddress = doc.Address;
    business.save();

    var account = new BusinessAccount();
    account.AccountOwner = business._id;
    account.BusinessName = doc.Name;
    account.IsPersonal = 1;
    account.Currency = "VND";
    account.Manager = doc._id;
    account.save(function(err, acc){
          if(err){
            console.log(err);
          }
          var businessCard = new BusinessCard();
          businessCard.CardOwner = doc._id;
          businessCard.AccountOwner = acc.AccountOwner;
          businessCard.BusinessName = acc.BusinessName;
          businessCard.Account = acc._id;
          businessCard.AccountNo = acc.AccountNo;
          businessCard.Currency = acc.Currency;
          businessCard.save(function(err2, card){
            if(err2){
              console.log(err2);
            }
                var cardBudget = new BusinessCardBudget();
                cardBudget.Card = card._id;
                cardBudget.CardNo = card.CardNo;
                cardBudget.Account = card.Account;
                cardBudget.AccountNo = card.AccountNo;
                cardBudget.AccountOwner = card.AccountOwner;
                cardBudget.BusinessName = card.BusinessName;
                cardBudget.Currency = card.Currency;
                cardBudget.AssignedUser = card.CardOwner;
                cardBudget.save();

          });

    });



    doc.UserSetting = setting._id;
    doc.UserStatus = status._id;
    doc.save();

  }
});

modelSchema.post('remove', function(doc) {

  Business.remove({User:this._id},function(err){});
  UserStatus.remove({User:this._id},function(err){});
  UserActivity.remove({User:this._id},function(err){});
  UserPosHistory.remove({User:this._id},function(err){});

  Business.remove({Represent:this._id},function(err){});
  BusinessAccount.remove({Manager:this._id},function(err){});
  BusinessCard.remove({CardOwner:this._id},function(err){});
  BusinessCardBudget.remove({AssignedUser:this._id},function(err){});
});


module.exports = mongoose.model('User',modelSchema);

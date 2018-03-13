
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({

    "CorpName" : {type: String, default: null},
    "CorpAddress" : {type: String, default: null},
    "CorpCountry" : {type: String,trim: true, default: "VN"},
    "CorpProvince" : {type: String,trim: true,default: null},
    "CorpHotline" : {type: String, default: null},
    "CorpHRHotline" : {type: String, default: null},
    "CorpHRContact" : {type: String, default: null},
    "CorpFIHotline" : {type: String, default: null},
    "CorpFIContact" : {type: String, default: null},
    "CorpEmailAddr" : {type: String,default: null, match: /\S+@\S+\.\S+/} ,
    "CorpHREmailAddr" : {type: String,default: null, match: /\S+@\S+\.\S+/} ,
    "CorpFIEmailAddr" : {type: String,default: null, match: /\S+@\S+\.\S+/} ,
    "CorpTaxNo" :{type: String, default: null},

    "PersonName" : {type: String,default: null},
    "PersonBirthday" : {type: Date,default: null},
    "PersonCitizenID" : {type: String,trim: true,default: null},
    "PersonCitizenIDDate" : {type: Date,default: null},
    "PersonCountry" : {type: String,trim: true, default: "VN"},
    "PersonProvince" : {type: String,trim: true,default: null},
    "PersonGender" : {type: String,  enum: ['Male', 'Female'],default: null},
    "PersonPhoneNo" : {type: String,trim: true,default: null},
    "PersonEmailAddr" : {type: String,default: null, match: /\S+@\S+\.\S+/} ,
    "PersonAddress" : {type: String, default: null},
    "PersonTaxNo" :{type: String, default: null},

    "Represent" : { type: ObjectId, ref: 'User' , default: null }


}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'Business' });

modelSchema.index({ PersonCountry: 1, PersonCitizenID: 1}, { unique: true });

modelSchema.index({ CorpCountry: 1, CorpProvince: 1, CorpTaxNo: 1}, { unique: true });

modelSchema.pre('save', function (next) {
  if (this.isNew){


  }

  next();
})

modelSchema.post('save', function(doc) {

});


module.exports = mongoose.model('Business',modelSchema);

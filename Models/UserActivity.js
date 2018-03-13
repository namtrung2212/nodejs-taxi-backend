
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "User" : { type: ObjectId, ref: 'User' , default: null },
    "Location" : { type: [Number],  index: '2d', default: [] },
    "ActionType" :{type: String, default: null}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'UserActivity' });


modelSchema.index({Location:1  , ActionType:1 });

var UserStatus     =   require("./UserStatus");


modelSchema.pre('save', function (next) {
  if (this.isNew){
      if(Array.isArray(this.Location) && 0 === this.Location.length) {
        this.Location = undefined;
      }
  }

  next();
})

modelSchema.post('save', function(doc) {

      if(doc.ActionType == "SignOut"
      || doc.ActionType == "Deactivate"
      || doc.ActionType == "CloseApp")
      {
              UserStatus.findOneAndUpdate({User: doc.User},
                                          {
                                              Location:doc.Location,
                                              IsOnline:0
                                          },function(err, numberAffected, raw){

                                          });

      }else
      {

              UserStatus.findOneAndUpdate({User: doc.User},
                                          {
                                              Location:doc.Location,
                                              LastLogin:((doc.ActionType == "Login") ? 1:0),
                                              LastOnline: new Date(),
                                              IsOnline:1
                                          },function(err, numberAffected, raw){

                                          });
      }
});


module.exports = mongoose.model('UserActivity',modelSchema);

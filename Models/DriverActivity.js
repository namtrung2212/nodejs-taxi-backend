
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Driver" : { type: ObjectId, ref: 'Driver' ,default: null},
    "Location" : { type: [Number],  index: '2d',default: []},
    "ActionType" :{type: String,default: null}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'DriverActivity' });


modelSchema.index({Location:1  , ActionType:1 });

var DriverStatus     =   require("./DriverStatus");


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
              DriverStatus.findOneAndUpdate({_id: doc.Driver},
                                          {
                                              Location:doc.Location,
                                              IsOnline:0
                                          },function(err, numberAffected, raw){

                                          });

      }else
      {

              DriverStatus.findOneAndUpdate({_id: doc.Driver},
                                          {
                                              Location:doc.Location,
                                              LastLogin:((doc.ActionType == "Login") ? 1:0),
                                              LastOnline:Date.now(),
                                              IsOnline:1
                                          },function(err, numberAffected, raw){

                                          });
      }
});


module.exports = mongoose.model('DriverActivity',modelSchema);


var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({

  model: {type: String,require: true},
  field: {type: String,require: true},
  count: {type: Number,default: 0}


}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'AutoNumbering' });


modelSchema.pre('save', function (next) {
  if (this.isNew){


  }

  next();
})

modelSchema.post('save', function(doc) {

});


module.exports = mongoose.model('AutoNumbering',modelSchema);

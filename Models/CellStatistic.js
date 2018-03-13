
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Location" : { type: [Number],  index: '2d', default: []},
    "Distance" : {type: Number, default: 0},
    "VehicleType" : {type: String, default: "Car"},
    "DriverQty" : {type: Number, default: 0},
    "OnlineUserQty" : {type: Number, default: 0},
    "OnDemandUserQty" : {type: Number, default: 0},
    "PotentialUserQty" : {type: Number, default: 0},
    "CompetitiveRatio" : {type: Number, default: 0},
    "AverageOrderQty" : {type: Number, default: 0},
    "AverageSpeed" : {type: Number, default: 0},
    "MaxLimitSpeed" : {type: Number, default: 0}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'CellStatistic' });


modelSchema.pre('save', function (next) {
  if (this.isNew){
      if(Array.isArray(this.Location) && 0 === this.Location.length) {
        this.PickupLoc = undefined;
      }
  }

  next();
})

// create model if not exists.
module.exports = mongoose.model('CellStatistic',modelSchema);

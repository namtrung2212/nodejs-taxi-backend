
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var modelSchema  = new Schema({
    "Country" : {type: String,trim: true, required: true, default: "VN"},
    "Province" : {type: String,trim: true, required: true},
    "No" : {type: String,trim: true, required: true},
    "VehicleType" : {type: String, default: null },
    "Brand" : {type: String,trim: true, required: true, default: ""},
    "Version" : {type: String,trim: true, required: true, default: ""},
    "OwnerName" : {type: String,trim: true, required: true, default: ""},
    "OwnerAddress" : {type: String, required: true, default: ""},
    "OwnerPhoneNo" : {type: String,trim: true, required: true, default: ""},
    "VehicleStatus" : { type: ObjectId, ref: 'VehicleStatus' , default: null}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'Vehicle' });

modelSchema.index({ Country: 1, No: 1}, { unique: true });

var VehicleStatus     =   require("./VehicleStatus");

modelSchema.pre('save', function (next) {
    this.wasNew = this.isNew;
    next();
});

modelSchema.post('save', function(doc) {


    if(!doc.VehicleStatus){

        var status = new VehicleStatus();
        status.Vehicle = doc._id;
        status.VehicleType = doc.VehicleType;
        status.VehicleNo = doc.No;
        status.VehicleBrand = doc.Brand;
        status.VehicleProvince = doc.Province;
        status.Country = doc.Country;
        status.save();

        doc.VehicleStatus=status._id;
        doc.save();
    }


});

modelSchema.post('remove', function(doc) {
  VehicleStatus.remove({Vehicle:doc});
});


//modelSchema.index({Country: 1, Province: 1,QualityService:1,VehicleType:1});



// create model if not exists.
module.exports = mongoose.model('Vehicle',modelSchema);

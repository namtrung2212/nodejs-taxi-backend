
var mongoose    =   require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var Q = require('q');

var modelSchema  = new Schema({

    "TravelOrder" : { type: ObjectId, ref: 'TravelOrder',default: null },

    "Currency" : { type: String, default: "VND" },
    "OrderPickupLoc" : { type: [Number],  index: '2d', default: []},
    "OrderPickupPlace" : {type: String, default: null},
    "OrderPickupCountry" : {type: String, default: 'Vietnam'},
    "OrderPickupTime" : {type: Date, default: null},
    "OrderDropLoc" : { type: [Number],  index: '2d', default: []},
    "OrderDropPlace" : {type: String, default: null},
    "OrderDuration" : { type: Number, default: null },
    "OrderDistance" : { type: Number, default: null },
    "OrderPolyline" : {type: String, default: null},
    "Driver" : { type: ObjectId, ref: 'Driver' ,default: null},
    "WorkingPlan" : { type: ObjectId, ref: 'WorkingPlan' ,default: null},
    "Company" : { type: ObjectId, ref: 'Company',default: null },
    "Team" : { type: ObjectId, ref: 'Team' ,default: null},
    "User" : { type: ObjectId, ref: 'User',default: null },
    "Message" : {type: String,default: null},
    "ExpireTime" : {type: Date,default: null},
    "Status" : {type: String,default: null}
}, { timestamps: { createdAt: 'createdAt' } },
{ collection: 'DriverBidding' });



modelSchema.pre('save', function (next) {

  if (this.isNew){

        this.Status = "Open";
        this.ExpireTime = new Date(new Date().getTime() + (6 * 60 * 60 * 1000));

        var that = this;
        getTravelOrder(this.TravelOrder).then(function(order){

              if(order != null){
                  that.Currency = order.Currency;
                  that.OrderPickupLoc = order.OrderPickupLoc;
                  that.OrderPickupPlace = order.OrderPickupPlace;
                  that.OrderPickupCountry = order.OrderPickupCountry;
                  that.OrderPickupTime = order.OrderPickupTime;
                  that.OrderDropLoc = order.OrderDropLoc;
                  that.OrderDropPlace = order.OrderDropPlace;
                  that.OrderDuration = order.OrderDuration;
                  that.OrderDistance = order.OrderDistance;
                  that.OrderPolyline = order.OrderPolyline;
              }
              next();
        });

  }else{
      next();
  }

});


function getTravelOrder(orderId){

  var deferred = Q.defer();

  var TravelOrder =   require("./TravelOrder");
  TravelOrder.findById(orderId,function(error,doc){

          if (error) {
              deferred.reject(new Error(error));
          }
          else {

            deferred.resolve(doc);
          }
   });

   return deferred.promise;

}


// create model if not exists.
module.exports = mongoose.model('DriverBidding',modelSchema);

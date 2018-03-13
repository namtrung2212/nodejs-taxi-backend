var map = require('google_directions');
var NodeGeocoder = require('node-geocoder');
var Q = require('q');
var redis = require('redis');
var config =require('../GlobalConfig');
var client = redis.createClient(config.RedisPort,config.RedisServer);

var exports = module.exports = {};

var googleAccount = {
  server_key : "AIzaSyAlymiLcFasZwEB0--1u4MrJYu62r25Blw"
};

var GeocoderOptions = {
  provider: 'google',

  // Optional depending on the providers
  httpAdapter: 'https', // Default
  //apiKey: 'YOUR_API_KEY', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(GeocoderOptions);

exports.getFullAddress = function(lat,long) {

    var deferred = Q.defer();

    var cacheKey = "getFullAddress" + lat.toString() +"," + long.toString();
    client.get(cacheKey, function(err, reply) {

        if(reply){
                deferred.resolve(JSON.parse(reply));
        }else{

                geocoder.reverse({lat:lat, lon:long}, function(err, data) {
                      client.set(cacheKey, JSON.stringify(data));
                      client.expire(cacheKey, 60*60*24); // 1 day
                      deferred.resolve(data);
                });

        }
    });

   return deferred.promise;

};

exports.getAddress = function(lat,long) {

    var deferred = Q.defer();

    var cacheKey = "getAddress" + lat.toString() +"," + long.toString();
    client.get(cacheKey, function(err, reply) {

        if(reply){
                deferred.resolve(JSON.parse(reply));
        }else{

                geocoder.reverse({lat:lat, lon:long}, function(err, data) {

                      if(data.length > 0){

                          var strAddress =data[0].formattedAddress;
                          client.set(cacheKey, JSON.stringify(strAddress));
                          client.expire(cacheKey, 60*60*24); // 1 day
                          deferred.resolve(strAddress);

                      }else{

                          deferred.resolve("");
                          
                      }
                });

        }
    });

   return deferred.promise;

};


exports.getFullDirections = function(sourceLat,sourceLong,destLat,destLong) {

    var deferred = Q.defer();

    var origin = sourceLat.toString() +"," + sourceLong.toString();
    var destination = destLat.toString() +"," + destLong.toString();

    var cacheKey = "getFullDirections" + origin + destination;
    client.get(cacheKey, function(err, reply) {

        if(reply){
                deferred.resolve(JSON.parse(reply));
        }else{

                var params = {
                    // REQUIRED
                    origin: origin,
                    destination: destination,
                    key: googleAccount.server_key,

                    // OPTIONAL
                    mode: "driving",
                  //  avoid: "",
                    language: "vi",
                    units: "metric",
                    region: "vn"
                };

                map.getDirections(params, function (error, data) {

                    if (error) {
                        console.log(error)
                        deferred.reject(new Error(error));
                    }
                    else {

                      client.set(cacheKey, JSON.stringify(data));
                      client.expire(cacheKey, 60*60*24); // 1 day
                      deferred.resolve(data);
                    }

                });

        }
    });

   return deferred.promise;

};


exports.getDirections = function(sourceLat,sourceLong,destLat,destLong) {

    var deferred = Q.defer();

    var origin = sourceLat.toString() +"," + sourceLong.toString();
    var destination = destLat.toString() +"," + destLong.toString();

    var cacheKey = "getDirections" + origin + destination;
    client.get(cacheKey, function(err, reply) {

        if(reply){
                deferred.resolve(JSON.parse(reply));
        }else{

                var params = {
                    // REQUIRED
                    origin: origin,
                    destination: destination,
                    key: googleAccount.server_key,

                    // OPTIONAL
                    mode: "driving",
                  //  avoid: "",
                    language: "vi",
                    units: "metric",
                    region: "vn"
                };

                map.getDirections(params, function (error, data) {

                    if (error || data.routes.length <= 0) {
                        console.log(error)
                        deferred.reject(new Error(error));
                    }
                    else {

                          var result = {
                              polyline : data.routes[0].overview_polyline.points,
                              distance : data.routes[0].legs[0].distance.value,
                              duration : data.routes[0].legs[0].duration.value
                          };

                          client.set(cacheKey, JSON.stringify(result));
                          client.expire(cacheKey, 60*60*24); // 1 day
                          deferred.resolve(result);

                    }

                });

        }

    });

   return deferred.promise;

};

exports.getDirectionPolyline = function(sourceLat,sourceLong,destLat,destLong) {

    var deferred = Q.defer();

    var origin = sourceLat.toString() +"," + sourceLong.toString();
    var destination = destLat.toString() +"," + destLong.toString();

    var cacheKey = "getDirectionPolyline" + origin + destination;
    client.get(cacheKey, function(err, reply) {

        if(reply){
                deferred.resolve(JSON.parse(reply));
        }else{

                var params = {
                    // REQUIRED
                    origin: origin,
                    destination: destination,
                    key: googleAccount.server_key,

                    // OPTIONAL
                    mode: "driving",
                  //  avoid: "",
                    language: "vi",
                    units: "metric",
                    region: "vn"
                };

                map.getDirections(params, function (error, data) {

                    if (error) {
                        console.log(error)
                        deferred.reject(new Error(error));
                    }
                    else {

                        var result = data.routes[0].overview_polyline.points;

                        client.set(cacheKey, JSON.stringify(result));
                        client.expire(cacheKey, 60*60*24); // 1 day
                        deferred.resolve(result);
                    }

                });
        }

     });

   return deferred.promise;

};

exports.getDistance = function(sourceLat,sourceLong,destLat,destLong) {

    var deferred = Q.defer();

    var origin = sourceLat.toString() +"," + sourceLong.toString();
    var destination = destLat.toString() +"," + destLong.toString();

        var cacheKey = "getDistance" + origin + destination;
        client.get(cacheKey, function(err, reply) {

            if(reply){
                    deferred.resolve(JSON.parse(reply));
            }else{

                    var params = {
                        // REQUIRED
                        origin: origin,
                        destination: destination,
                        key: googleAccount.server_key,

                        // OPTIONAL
                        mode: "driving",
                      //  avoid: "",
                        language: "vi",
                        units: "metric",
                        region: "vn"
                    };

                    map.getDirections(params, function (error, data) {

                        if (error) {
                            console.log(error)
                            deferred.reject(new Error(error));
                        }
                        else {

                            var result = data.routes[0].legs[0].distance.value;

                            client.set(cacheKey, JSON.stringify(result));
                            client.expire(cacheKey, 60*60*24); // 1 day
                            deferred.resolve(result);

                        }

                    });
            }

        });

    return deferred.promise;

};


exports.getDuration = function(sourceLat,sourceLong,destLat,destLong) {

    var deferred = Q.defer();

    var origin = sourceLat.toString() +"," + sourceLong.toString();
    var destination = destLat.toString() +"," + destLong.toString();

    var params = {
        // REQUIRED
        origin: origin,
        destination: destination,
        key: googleAccount.server_key,

        // OPTIONAL
        mode: "driving",
      //  avoid: "",
        language: "vi",
        units: "metric",
        region: "vn"
    };

    map.getDirections(params, function (error, data) {

          if (error) {
              console.log(error)
              deferred.reject(new Error(error));
          }
          else {

            deferred.resolve(data.routes[0].legs[0].duration.value);
          }

    });

    return deferred.promise;

};

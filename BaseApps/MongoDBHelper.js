
var Q = require('q');
var redis = require('redis');
var config =require('../Servers/GlobalConfig');
var client = redis.createClient(config.RedisPort,config.RedisServer);
async = require("async");


var exports = module.exports = {};


exports.createObject = function(modelName,req,options){

      var deferred = Q.defer();

      var objectModel     =   require("../Models/" + modelName);
      var obj = new objectModel();

      obj.schema.eachPath(function(key) {
        if(req.body.hasOwnProperty(key)){
            obj[key]=req.body[key];
        }
      });

      obj.save(function(err,objNew){

        var response = {};
          if(err) {
              response = {"error" : true,"message" : err};
          } else {
              response =  objNew;
          }

          deferred.resolve(response);
      });

      return deferred.promise;

};



exports.updateObject = function(modelName,req,options){

      var deferred = Q.defer();

      var objectModel     =   require("../Models/" + modelName);

      var response = {};

      objectModel.findById(req.params.id,function(err,obj){

          if(err) {

              response = {"error" : true,"message" : err};
              deferred.resolve(response);

          } else {

              if(!obj)
              {
                    response = {"error" : true,"message" : "Can not find object with id= "+req.params.id};
                    deferred.resolve(response);
                    return;
              }

              obj.schema.eachPath(function(key) {

                    if(req.body.hasOwnProperty(key)){
                        obj[key]=req.body[key];
                    }
              });

              obj.save(function(err,objNew){

                    if(err) {
                        response = {"error" : true,"message" : err};
                    } else {
                        response = objNew;
                    }

                    deferred.resolve(response);

                    var expireTime =  config.DefaultExpireRecord;
                    if(options&&options.expireRecord)
                        expireTime =  options.expireRecord;

                    if(expireTime != null && expireTime > 0){

                        var cacheKey=modelName+req.params.id;
                        client.set(cacheKey, JSON.stringify(response));
                        client.expire(cacheKey, expireTime);

                    }

              })

          }
      });

      return deferred.promise;

};


exports.updateAll = function(modelName,req,options){

      var deferred = Q.defer();

      var objectModel     =   require("../Models/" + modelName);

      var response = {};

      var queryBuilder=objectModel.where();

      var obj = new objectModel();
      for (var propName in req.query) {
          if (propName in obj)
            queryBuilder=queryBuilder.where(propName,req.query[propName]);
      }

      var update = {};

      obj.schema.eachPath(function(propName) {
            if(req.body.hasOwnProperty(propName)){
                    update[propName] = req.body[propName];
            }
      });

      queryBuilder=queryBuilder.setOptions({ multi: true });
      queryBuilder=queryBuilder.update({ $set: update });
      queryBuilder.exec(function(err,data){
            if(err) {
                response = {"error" : true,"message" : err};
            } else {
                response = data;
            }

            deferred.resolve(response);
      });

      return deferred.promise;

};


exports.deleteObject = function(modelName,req,options){

      var deferred = Q.defer();

      var objectModel     =   require("../Models/" + modelName);
      var response = {};

      objectModel.findById(req.params.id,function(err,obj){

          if(err) {

              response = {"error" : true,"message" : err};
              deferred.resolve(response);

          } else {

              if(obj == null)
              {
                    response = {"error" : true,"message" : "Can not find object with id= "+req.params.id};
                    deferred.resolve(response);
                    return;
              }

                                            console.log("remove");
              obj.remove(function(err){

                  var response = {};
                  if(err) {
                      response = {"error" : true,"message" : err};
                  } else {
                      response = {"error" : false,"message" : "Data associated with is deleted"};
                  }

                  deferred.resolve(response);

                  var key=modelName+req.params.id;
                  client.del(key);
              });

          }
      });

      return deferred.promise;

};



exports.deleteAll = function(modelName,req,options){

      var deferred = Q.defer();

      var objectModel     =   require("../Models/" + modelName);
      var response = {};

      var queryBuilder=objectModel.find();

      var obj = new objectModel();
      for (var propName in req.query) {
          if (propName in obj)
            queryBuilder=queryBuilder.where(propName,req.query[propName]);
      }

      if(req.query.lastUpdated)
          queryBuilder=queryBuilder.where('updatedAt').gt(req.query.lastUpdated);

      queryBuilder=queryBuilder.exec(function(err,data){
            async.each(data, function(item, callback) {
                item.remove();
            });

            deferred.resolve(data.length);
      });

      return deferred.promise;

};


exports.getAll = function(modelName,req,options){

      var deferred = Q.defer();

      var objectModel     =   require("../Models/" + modelName);

      var cacheKey=req.originalUrl;
      client.get(cacheKey, function(err, reply) {

          if(reply){

                deferred.resolve(JSON.parse(reply));
                return;

          }else{

                var queryBuilder=objectModel.find();

                var obj = new objectModel();
                for (var propName in req.query) {
                    if (propName in obj)
                      queryBuilder=queryBuilder.where(propName,req.query[propName]);
                }

                if(req.query.lastUpdated)
                    queryBuilder=queryBuilder.where('updatedAt').gt(req.query.lastUpdated);

                var sortField = "updatedAt";
                if(req.query.sortField){
                  sortField = req.query.sortField;
                }

                if(req.query.sort){
                    queryBuilder=queryBuilder.sort([[sortField, req.query.sort]]);
                }else {
                    queryBuilder=queryBuilder.sort([[sortField, -1]]);
                }

                if(req.query.pagesize&&req.query.page )
                {
                    queryBuilder=queryBuilder.skip( parseInt(req.query.pagesize)* (parseInt(req.query.page)-1));
                    queryBuilder=queryBuilder.limit( parseInt(req.query.pagesize));
                }

                if(req.originalUrl.indexOf("selectID") > -1)
                    queryBuilder=queryBuilder.select('_id updatedAt');

                queryBuilder=queryBuilder.exec(function(err,data){

                      var response = {};

                      if(err) {
                          response = {"error" : true,"message" : err};
                      } else {
                          response = data;
                      }

                      if(!req.query.lastUpdated)
                      {

                          var expireTime =  config.DefaultExpireDataset;

                          if(options&&options.expireDataset)
                              expireTime =  options.expireDataset;

                          if(expireTime != null && expireTime > 0){

                              client.set(cacheKey, JSON.stringify(response));
                              client.expire(cacheKey, expireTime);

                          }

                      }

                      deferred.resolve(response);
                });
          }

      });

      return deferred.promise;

};


exports.getByID = function(modelName,req,options){

      var deferred = Q.defer();

      var objectModel     =   require("../Models/" + modelName);

      client.get(modelName+req.params.id, function(err, reply) {

          if(reply){

                  deferred.resolve(JSON.parse(reply));

          }else {

              var response = {};
              objectModel.findById(req.params.id,function(err,data){

                  if(err) {
                      response = {"error" : true,"message" : err};
                  } else {
                      response =  data;
                  }

                  var expireTime =  config.DefaultExpireRecord;

                  if(options&&options.expireRecord)
                      expireTime =  options.expireRecord;

                  if(expireTime != null && expireTime > 0){

                      var cacheKey=modelName+req.params.id;
                      client.set(cacheKey, JSON.stringify(response));
                      client.expire(cacheKey, expireTime);

                  }

                  deferred.resolve(response);
              });
          }
      });


      return deferred.promise;

};

exports.count = function(modelName,req,options){

      var deferred = Q.defer();

      var objectModel     =   require("../Models/" + modelName);

      var cacheKey=req.originalUrl;
      client.get(cacheKey, function(err, reply) {

          if(reply){

                deferred.resolve(JSON.parse(reply));
                return;

          }else{

                var queryBuilder=objectModel.find();

                var obj = new objectModel();
                for (var propName in req.query) {
                    if (propName in obj)
                      queryBuilder=queryBuilder.where(propName,req.query[propName]);
                }

                if(req.query.lastUpdated)
                    queryBuilder=queryBuilder.where('updatedAt').gt(req.query.lastUpdated);

                var sortField = "updatedAt";
                if(req.query.sortField){
                  sortField = req.query.sortField;
                }

                if(req.query.sort){
                    queryBuilder=queryBuilder.sort([[sortField, req.query.sort]]);
                }else {
                    queryBuilder=queryBuilder.sort([[sortField, -1]]);
                }

                if(req.query.pagesize&&req.query.page )
                {
                    queryBuilder=queryBuilder.skip( parseInt(req.query.pagesize)* (parseInt(req.query.page)-1));
                    queryBuilder=queryBuilder.limit( parseInt(req.query.pagesize));
                }

                queryBuilder=queryBuilder.count();

                queryBuilder=queryBuilder.exec(function(err,data){

                      var response = {};

                      if(err) {
                          response = {"error" : true,"message" : err};
                      } else {
                          response = data;
                      }

                      if(!req.query.lastUpdated)
                      {

                          var expireTime =  config.DefaultExpireDataset;

                          if(options&&options.expireDataset)
                              expireTime =  options.expireDataset;

                          if(expireTime != null && expireTime > 0){

                            client.set(cacheKey, JSON.stringify(response));
                                client.expire(cacheKey, expireTime);

                          }

                      }

                      deferred.resolve(response);
                });
          }

      });

      return deferred.promise;

};

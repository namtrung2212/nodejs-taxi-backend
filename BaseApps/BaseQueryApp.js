module.exports = function (modelName, options) {

    var express = require('express');
    var app         =   express();
    var bodyParser  =   require("body-parser");
    var router      =   express.Router();

    var MongoDBHelper =require('./MongoDBHelper');

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({"extended" : false}));

    router.route("/count").get(function(req,res){

          MongoDBHelper.count(modelName,req,options).then(function(response){

              res.json(response);

          });
    });

    router.route("/selectall").get(function(req,res){

          MongoDBHelper.getAll(modelName,req,options).then(function(response){

              res.json(response);

          });
    });

    router.route("/selectID").get(function(req,res){

          MongoDBHelper.getAll(modelName,req,options).then(function(response){

              res.json(response);

          });
    });

    router.route("/ID/:id")
      .get(function(req,res){

          MongoDBHelper.getByID(modelName,req,options).then(function(response){

              res.json(response);

          });

      });

    if(options&&options.customQueryAPIs)
    {
      var method = options.customQueryAPIs ;
      router=method(router);
    }

    app.use('/'+modelName,router);

    return app;
};

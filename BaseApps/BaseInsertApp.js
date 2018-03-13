
module.exports = function (modelName,options) {

    var MongoDBHelper =require('./MongoDBHelper');

    var express = require('express');
    var app  =   express();
    var bodyParser  =   require("body-parser");
    app.use(bodyParser.json());

    var router      =   express.Router();
    router.post("/create", function(req, res) {

          MongoDBHelper.createObject(modelName,req).then(function(response){

              res.json(response);

          });
    });


    router.patch("/ID/:id", function(req, res) {

          MongoDBHelper.updateObject(modelName,req,options).then(function(response){

              res.json(response);

          });

    });


    router.patch("/updateall", function(req,res){

          console.log("updateall");
          MongoDBHelper.updateAll(modelName,req,options).then(function(response){

              res.json(response);

          });
    });

    router.delete("/ID/:id", function(req, res) {

          MongoDBHelper.deleteObject(modelName,req,options).then(function(response){

              res.json(response);

          });

    });


    router.delete("/delete", function(req, res) {

          MongoDBHelper.deleteAll(modelName,req,options).then(function(response){

              res.json(response);

          });

    });

    if(options&&options.customInsertAPIs)
    {
      var method = options.customInsertAPIs ;
      router=method(router);
    }

    app.use('/'+modelName,router);

    return app;
};

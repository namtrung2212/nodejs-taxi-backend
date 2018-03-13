
module.exports = function (modelName,options) {

    var express = require('express');
    var app         =   express();


    var bodyParser  =   require("body-parser");
    var router      =   express.Router();
    var redis = require('redis');
    var config =require('../Servers/GlobalConfig');
    var client = redis.createClient(config.RedisPort,config.RedisServer);

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({"extended" : false}));

  //  var objectModel     =   require("../Models/" + modelName);


    return app;
};

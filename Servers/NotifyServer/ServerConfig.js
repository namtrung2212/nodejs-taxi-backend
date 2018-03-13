var config = {}

config.WorkerNumber = require('os').cpus().length;
config.TaxiNofifyServer = "http://localhost";
config.TaxiNotifyServerPort = 4050;
module.exports = config;

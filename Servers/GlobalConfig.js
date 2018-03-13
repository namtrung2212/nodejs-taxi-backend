var config = {}

config.DefaultExpireRecord = 5;  //seconds
config.DefaultExpireDataset = 20; //seconds

config.RedisPort =6379;
config.RedisServer = "localhost";

//Load Balancing
config.SeaportServer = "localhost";
config.SeaportPort = 9090;
config.ProxyPort = 8000;

config.DBAddress = 'mongodb://localhost:27017/booktaxi';
config.ManagerServer = "http://localhost"; //must have http://
config.ManagerServerPort = 4000;

module.exports = config;

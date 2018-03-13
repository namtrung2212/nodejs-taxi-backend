var config =require('../Servers/GlobalConfig');
require("mongoose").connect(config.DBAddress);
var Q = require('q');

var data =   require("./02TeamData.json");
var Company =   require("../Models/Company");
var Team =   require("../Models/Team");

var count = 0

Q.all(data.map(function(item) {

      return ImportTeam(item);
    })
);

function ImportTeam(item){

    return  Q.resolve(item)
            .then(function(item){
                  var team = new Team();
                    team.schema.eachPath(function(key) {

                      if(item.hasOwnProperty(key)){
                          if( key != "Company" ){
                            team[key]= item[key];
                          }
                      }
                    });
                    return [team,item];

              }).spread(function (team,item){

                          if(item.hasOwnProperty("Company")){
                                  Company.find().where("Name",item.Company).limit(1).exec(function(err,result){

                                        count++;

                                        if(!err) {
                                              if(result.length > 0){
                                                team.Company= result[0]._id;
                                                team.save(function(err,obj){
                                                  if(err){
                                                      console.log(err);
                                                  }else{
                                                      console.log("Team " + obj.Name );
                                                  }
                                                });
                                                return;
                                              }
                                        }

                                        console.log("Team " + count + " with wrong Company ");
                                  });
                          }

              })
}


/*
for(var item in data){

  Promise.resolve(item).then(function(item) {

    var team = new Team();
    console.log(item);
    console.log(data[item]);
      team.schema.eachPath(function(key) {

        if(data[item].hasOwnProperty(key)){
            if( key == "Company" ){
                console.log(data[item].Company);
                Company.find().where("Name",data[item].Company).limit(1).exec(function(err,result){
                      if(!err) {
                            return result[0];
                      }else {
                            return null;
                      }
                });

            }else{
              team[key]=data[item][key];
            }
        }
      });
    //  return team;
  }).then(function(company) {
      if(company){
          team.Company = company._id;
          team.save();
          count++
          console.log("Team " + count + " : " +  team);
      }else {
          console.log("Team " + team.Name + " with wrong Company " +  team);
      }
  });
*/

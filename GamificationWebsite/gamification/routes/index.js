var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Transamerica' });
});


/* ONEJIRA TEAMS for filetering based of team names*/
router.get('/collections', function(req, res){
	var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/onejira';

	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect to MongoDB', err);
		}else{
			console.log("Connection to MongoDB Established");

			db.listCollections().toArray(function(err, items) {
            	if(items.length <= 0){
					console.log("No collections in database");
				}else{
					var teamList = [];
					var i;
					for(i = 0; i < items.length; i++){
						var str = items[i].name;
						if(!str.includes('Userstory')){
							teamList.push(items[i]);
						}
					}
					res.render('collections', {
					"teamList" : teamList,
				});
			}
            	db.close();
    		});
		}
	});
});

/* Options for after team filter*/
router.get('/collectionFilter', function(req, res){
	var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/onejira';

	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect to MongoDB', err);
		}else{
			console.log("Connection to MongoDB Established");
			var collectionName = req.url.split("?")[1];
			var collection = db.collection(collectionName);


			db.listCollections().toArray(function(err, items) {
            	if(items.length <= 0){
					console.log("No collections in database");
				}else{
					var teamList = [];
					var i;
					for(i = 0; i < items.length; i++){
						var str = items[i].name;
						if(str.includes(collectionName)){
							teamList.push(items[i]);
						}
					}
					res.render('collectionsFilter', {
					"teamEntries" : teamList,
					"teamName" : collectionName
				});
			}
            	db.close();
    		});

		}	

	});
});

/* Display team members*/
router.get('/teamRoster', function(req,res){
	var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/onejira';

	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect to MongoDB from Team Roster page', err);
		}else{
			console.log("Connection to MongoDB Established from Team Roster page");
			var title = req.url.split("?")[1].substring(5, 10) + " Team Roster";
			var collectionName = req.url.split("?")[1] + 'Userstory'; 
			var collection = db.collection(collectionName);
			var teamMemberNames = [];
			var teamMemberEmails = [];
			var cursor = 
			

			collection.aggregate([
			{
				$unwind : "$issues"
			},{
				$group : {
          			_id: "$issues.fields.assignee.displayName",
          			email : { "$first": "$issues.fields.assignee.emailAddress"}
          		}
          	},{
          		$match : {
          			_id : {
          				$ne: null
          			}
          		}
			}]).toArray(function(err, result){
				if(err){
					res.send(err);
				} else if(result.length){
					res.render('teamRoster', {"teamMembers": result, "title": title});
				} else {
					res.send("No team members in database for this team.");
				}
				db.close();
			});
		}
	});
});

/* Display MongoDB data for that team*/
router.get('/collectionData', function(req, res){
	var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/onejira';

	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect to MongoDB', err);
		}else{
			console.log("Connection to MongoDB Established");

			var title = req.url.split("?")[1].substring(5, 10);
			var collectionName = req.url.split("?")[1];
			var collection = db.collection(collectionName);

			collection.find({}).toArray(function(err, result){
				if(err){
					res.send(err);
				} else if(result.length){
					res.render('collectionData', {
						"title": title,
						"teamName":collectionName,
						"dataList":result
					});
				} else {
					res.send("No data for this team");
				}

				db.close();
			});
		}
	});
});

/*Team Velocity*/
router.get('/velocity', function (req, res) {
    var MongoClient = mongodb.MongoClient;
    var url = 'mongodb://localhost:27017/onejira';

    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to MongoDB', err);
        } else {
            console.log("Connection to MongoDB Established");
            
            var collectionName = req.url.split("?")[1] + "Userstory";
            var collection = db.collection(collectionName);
            var teamName = collectionName.substring(5, 10);

            /*Variables for Velocity*/
			var checkedIssues = [];
            var sprints = [];
            var committedVelocities = [];
            var completedVelocities = [];


            /*Variables for Average Velocity*/
            var avgCommitThreeSprints = 0;
            var avgCompleteThreeSprints = 0;
            var avgCommit = 0;
            var avgComplete = 0;
            
            function lookup(key, array) {
                for (var i = 0; i < array.length; i++) {
                    if (key === array[i]) {
                        return i;
                    }
                }
                return -1;
            }

            collection.aggregate()
                .unwind("$issues")
                .project({
                    sprint_info: "$issues.fields.customfield_10004",
                    story_points: "$issues.fields.customfield_10006",
                    issue_id: "$issues.id",
                    complete_status: "$issues.fields.status.statusCategory.name"
                }).toArray(function (err, result) {
                if (err){
                    res.send(err);
                } else {

                	/* Calculating Velocity*/
                    for (var i = 0; i < result.length; i++) {
                        
                        if ((result[i].story_points != null) && 
                        	(result[i].sprint_info != null)){ 
                        	
                        	var existstingIndex = lookup(result[i].issue_id, checkedIssues);

                        	if(existstingIndex === -1){
                            	checkedIssues[checkedIssues.length] = result[i].issue_id;
                        	}else if(existstingIndex > -1 && result[i].complete_status !== "Done"){
                        		continue;
                        	}

                            var sprintDetails = result[i].sprint_info[0];
                            var indexFrom = sprintDetails.indexOf("name=") + 'name='.length;
                            var indexTo = sprintDetails.indexOf(",startDate");
                            var sprintName = sprintDetails.substring(indexFrom, indexTo);
                            var index = sprints.length;

                            if (lookup(sprintName, sprints) === -1) {
                                sprints[index] = sprintName;
                                committedVelocities[index] = 0;
                                completedVelocities[index] = 0;
                            }

                            index = lookup(sprintName, sprints);

                            committedVelocities[index] += result[i].story_points;
                            if (result[i].complete_status === "Done") {
                                completedVelocities[index] += result[i].story_points;
                            }
                        }
                    }

                    /* Calculating Average Velocity*/

                    var j = 0;

                    for (var i = 0; i < committedVelocities.length; i++) {
                        if (((committedVelocities.length - i) > 0) && (i < 3)) {
                            avgCommitThreeSprints += committedVelocities[committedVelocities.length - i - 1];
                            avgCompleteThreeSprints += completedVelocities[completedVelocities.length - i - 1];
                            j++;
                        }
                        avgCommit += committedVelocities[committedVelocities.length - i - 1];
                        avgComplete += completedVelocities[completedVelocities.length - i - 1];
                    }

                    avgCommit /= committedVelocities.length;
                    avgComplete /= completedVelocities.length;
                    avgCommitThreeSprints /= j;
                    avgCompleteThreeSprints /= j;
                }


            	res.render('velocityData', {
                    "teamName": teamName,
                    "avgCommit": avgCommit.toFixed(3),
                    "avgComplete": avgComplete.toFixed(3),
                    "avgCommitThreeSprints": avgCommitThreeSprints.toFixed(3),
                    "avgCompleteThreeSprints": avgCompleteThreeSprints.toFixed(3),
                    "committedVelocities": committedVelocities,
                    "completedVelocities": completedVelocities,
                    "sprints": sprints
                });

                db.close();
            });

        }
    });
});

module.exports = router;

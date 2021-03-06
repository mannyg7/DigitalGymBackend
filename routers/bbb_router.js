var express = require('express');
var router = express.Router();
var models = require('../models');
var data = models.BikeData
var user = models.User
var session = models.SessionData
var spawn = require("child_process").spawn
var sequelize = require('sequelize');

router.get("/users", function(req, res){
	user.findAll().then(function(list){
		res.setHeader('Content-Type', 'application/json');
        res.send(list);
	})
});
router.get("/data", function(req, res){
	data.findAll().then(function (list) {
        res.setHeader('Content-Type', 'application/json');
        res.send(list);
    })
});
router.get("/data/last", function(req,res){
	data.findOne({
		order: "stamp DESC"
	}).then(function(list){
		res.setHeader('Content-Type', 'application/json');
        res.send(list);
	})
})
router.get("/sessionlisten", function(req, res){
	session.findOne({
		where: {stampEnd: null}
	}).then(function(list){
		if(list){
		user.findOne({
			where: {id: list.dataValues.userId}
		}).then(function(user){
			res.send({status: "success", user: user})
		})
		}else{
			res.send({status: "failure"})
		}
	})
})

router.post("/setup_account", function(req, res) {
	user.update({
		name: req.body.name,
		email: req.body.email,
		pswd: req.body.password
	}, {
		where: [{id: req.body.userId}]
	}).then(function(list){
        res.send({status: "success"});
	}).error(function(e){
		res.send({status: "failure"})
	})
})
router.post("/logout", function(req, res){
	session.update({
  stampEnd: new Date().getTime(),
},{		where:
			[{userId: req.body.userId}]
	}).then(function(list){
        res.send({status: "success"});
	})
})
router.post("/addsession", function(req, res) {
    session.findAll(
        {where: {
            stampEnd: null
        }}).then(function(list) {
        	if(list.length == 0){
        user.findAll({
            where: [{
                rfid: req.body.tag
            }]
        }).then(function(list) {
            if (list.length == 0) {
                user.create({
                    rfid: req.body.tag
                }).then(function(user) {
                    console.log(user)
                    session.create({
                        stampStart: new Date().getTime(),
                        userId: user.dataValues.id
                    })
                    res.send({
                        status: "new"
                    })
                })
            } else {
                res.send({
                    status: "old",
                    user: list[0]
                })
                session.create({
                    stampStart: new Date().getTime(),
                    userId: list[0].dataValues.id
                })
            }
        })
    }
    else{
    	res.send({status: "busy"})
    }
})
   
    
});
String.prototype.toHHMMSS = function () {
	console.log(this)
	// this should be in milliseconds, second parameter is the base (i.e., decimal)
    var sec_num = parseInt(this, 10) / 1000
    var hours   = Math.floor(sec_num / 3600)
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60)
    var seconds = Math.floor(sec_num - (hours * 3600) - (minutes * 60))

    // if (hours   < 10) {hours   = "0" + String(hours)}
    // if (minutes < 10) {minutes = "0" + String(minutes)}
    // if (seconds < 10) {seconds = "0" + String(seconds)}
    return ((hours < 10) ? ("0" + String(hours)) : String(hours)) + ":" 
		+ ((minutes < 10) ? ("0" + String(minutes)) : String(minutes)) + ":" 
		+ ((seconds < 10) ? ("0" + String(seconds)) : String(seconds))
}
// Date.prototype.toHHMMSS = function () {
// 	var hours = this.getHours()
// 	var minutes = this.getMinutes()
// 	var 
// }

router.get("/login", function(req, res) {
	user.findOne({
		where: {
			email: req.body.email
		}
	}).then(function(user) {
		if (user) {
			if (req.body.password == user.pswd) {
				res.send({status: "success", user: user})
			}
			else {
				res.send({status: "failure"})
			}			
		}
		else {
			res.send({status: "failure"})
		}
	})
})
router.get("/average_duration", function(req, res){
	session.findAll({
		where: {
			userId: req.body.userId,
			stampEnd: {
				$ne: null
			}
		}}).then(function(sessions){
			var total_dur = 0
			var count = 0
			for(inc in sessions){
				var start = sessions[inc].stampStart
				var end = sessions[inc].stampEnd
				if (start != null && end != null) {
					count = count + 1
					console.log(start)
					console.log(end)
					total_dur = total_dur + ((parseInt(end) - parseInt(start)))
				}
			}
			if (count == 0) {
				res.send({success: false, duration: ""})
			}
			else {
				res.send({success: true, duration: (String(total_dur / count)).toHHMMSS()})
			}
		})
})
router.get("/workout_duration", function(req, res){
	session.findOne(
        {where: {
            stampEnd: null
        }}).then(function(ses) {
        	var start = parseInt(ses.stampStart)
			var end = new Date().getTime()
        	res.send({success: true, duration: String((end - start)).toHHMMSS()})
        });
})
// the most recent workout is defined to be the one that was created most recently
router.get("/get_last_workout", function(req, res){
	session.findAll(
		{where: {
			userId: req.body.userId,
			stampEnd: {
				$ne: null
			}
		}}).then(function(sessions){
		var most_recent_date = -1
		for (inc in sessions) {
			var date = Date.parse(sessions[inc].createdAt)
			if (date > most_recent_date) {
				most_recent_date = date
			}
		}
		if (most_recent_date > -1) {
			res.send({date: String((new Date(most_recent_date)).toDateString())})
		} else {
			res.send({date: ""})
		}
	})
})
router.post("/addname", function(req, res){
	user.update({
  	name: req.body.name,
},{
		where:
			[{id: req.body.userId}]
	}).then(function(list){
        res.send({status: "success"});
	}).error(function(e){
		res.send({status: "failure"})
	})
});
router.post("/addemailgender", function(req, res){
	user.update({
 	email: req.body.name,
 	gender: req.body.gender
},{
		where:
			[{id: req.body.userId}]
	}).then(function(list){
        res.send({status: "success"});
	}).error(function(e){
		res.send({status: "failure"})
	})
});
router.post("/bike", function(req, res){
	session.findOne({where:{
		stampEnd: null
	}
	}).then(function(session){
		console.log(session)
		data.create({
			stamp:  new Date().getTime(),
			rpm: req.body.rpm,
			bikeId: req.body.bikeId,
			sessionId: session.dataValues.id
		})
	})
	res.send("Upload Success")
});
router.post("/history", function(req,res){
	session.findAll({
		where: {
			userId: req.body.userId,
			stampEnd: {
				$ne: null
			}
		},
		include:[
		{model: data, as: "data"}
		]
	}).then(function(history){

		history_list = []
		for(entry in history){
			past_workout = history[entry].dataValues
			if(past_workout != null){
			var milli_to_minutes = (1/60000.0)
			history_list.push({})

			total = 0
			//loop through all data values
			for (point in past_workout.data){
				total += past_workout.data[point].rpm
			}

			expectation = total/parseFloat(past_workout.data.length)
			history_list[entry].average_rpm = expectation
			history_list[entry].distance = 0.0044*(past_workout.stampEnd-past_workout.stampStart)*milli_to_minutes*expectation
			history_list[entry].duration = String(past_workout.stampEnd - past_workout.stampStart).toHHMMSS()
			history_list[entry].date = new Date(Date.parse(past_workout.createdAt)).toDateString()
		}
	}
		res.send(history_list)
	})
})
module.exports = router; 
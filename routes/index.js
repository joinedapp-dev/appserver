// Define routes for Joinedapp REST service 
var ph      = require('password-hash')
  , fs      = require('fs')
  , msg     = require('../messaging')
  , db      = require('../sql_db');

module.exports.site = function(request, response) {
    if (request.user){
	//var data = fs.readFileSync(__dirname + '/../index.html').toString();
	//response.send(data);
	console.log("================= RENDER HOME");
	response.render('home.jade');
    }else{
	console.log("================= RENDER LOGIN");
	response.render('login.jade');
    }
};

module.exports.all_users = function(request, response) {
    console.log("Inside GET /users");
    global.db.User.findAll().success(function(users) {
	if (users){
	    var users_json = [];
	    console.log("users = '" + JSON.stringify(users, null, 4) + "'");
	    users.forEach(function(user) {
		users_json.push({
		    id: user.id, 
		    signInId: user.signInId, 
		    password: ph.generate(user.password),
		    signInType: user.signInType
		});
	    });
	    // Uses views/users.ejs
	    //response.render("users", {users: users_json});
   	    response.send(users_json);
	}else{
	    response.send("[]");
	}
    }).error(function(err) {
	console.log(err);
	response.statusCode = 503;
        response.send({
	    result: 'error',
	    err:    err.code
        });
	//response.send("error retrieving users");
    });
};


module.exports.get_user = function(request, response) {
    console.log("Inside GET /user/:signInId/:signInType");
    console.log("SignInId = " + request.params.signInId);
    console.log("SignInType = " + request.params.signInType);
    if (request.params.signInId && request.params.signInType){
	global.db.User.find({
	    where: {
		signInId: request.params.signInId,
		signInType: request.params.signInType
	    }
	}).success(function(user) {
            var users_json = [];
            if (user)
	    {
		console.log("user = '" + JSON.stringify(user, null, 4) + "'");
		users_json.push({id: user.id, signInId: user.signInId, signInType: user.signInType, password: user.password});
		response.send(users_json);
	    }else{
		response.send("[]");
	    }
	}).error(function(err) {
            console.log(err);
            response.statusCode = 503;
            response.send({
		result: 'error',
		err:    err.code
            });
            //response.send("error retrieving users");
	});
    }else{
	response.send("Error: GET missing signInType/signInId pair");
    }
};

module.exports.add_user = function(request, response) {
    console.log("Inside POST /user");
    console.log("email = " + request.body.signInId);
    console.log("password = " + request.body.password);
    console.log("body = " + JSON.stringify(request.body, null, 4));
    if (request.body.signInId && request.body.password){
	global.db.User.create({
            signInId: request.body.signInId,
	    signInType: 'EMAIL',
	    password: ph.generate(request.body.password)
	}).error(function(err) {
            console.log(err);
            response.statusCode = 503;
            response.send({
		result: 'error',
		err:    err.code
            });
            //response.send("error retrieving users");
	}).success(function(result){
	    response.send("POST OK");
	    // update website with new user added
	    // ... first query mysql table
	    global.db.User.find({
		where: {
		    signInId: request.body.signInId,
		    signInType: request.body.signInType
		}
            }).success(function(user) {
		if (user){
		    msg.updateTable(user.id, user.signInId, user.signInType, user.createdAt);
		}
	    });
	});
    }else{
	response.send("Error: POST missing email and/or password");
    }
};

module.exports.update_user = function(request, response) {
    console.log("Inside PUT /user");
    console.log("signInId = " + request.body.signInId);
    console.log("signInType = " + request.body.signInType);
    console.log("password = " + request.body.password);
    console.log("body = " + JSON.stringify(request.body, null, 4));
    if (request.body.signInId && request.body.signInType && request.body.password){
        global.db.User.update(
	    {
		password: ph.generate(request.body.password)
	    },
	    {
		signInId: request.body.signInId,
		signInType: request.body.signInType
	    }
	).error(function(err){
	    console.log(err);
	    response.statusCode = 503;
	    response.send({
                result: 'error',
                err:    err.code
	    });
	});
	response.send("PUT OK");
    }else{
        response.send("Error: PUT missing signInId, signInType, and/or password");
    }
};

module.exports.delete_user = function(request, response) {
    console.log("Inside DELETE /user");
    console.log("signInId = " + request.body.signInId);
    console.log("signInType = " + request.body.signInType);
    console.log("body = " + JSON.stringify(request.body, null, 4));
    if (request.body.signInId && request.body.signInType){
        global.db.User.destroy(
            {
		signInType: request.body.sigInType,
                signInId: request.body.signInId
            }
        ).error(function(err){
            console.log(err);
            response.statusCode = 503;
            response.send({
                result: 'error',
                err:    err.code
            });
        });
        response.send("DELETE OK");
    }else{
        response.send("Error: DELETE missing signInId and/or signInType");
    }
};


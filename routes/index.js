// Define routes for Joinedapp REST service 
var ph      = require('password-hash')
  , db      = require('../relational_db');


var fs = require('fs');

module.exports.site = function(request, response) {
    var data = fs.readFileSync(__dirname + '/../index.html').toString();
    response.send(data);
};

module.exports.all_users = function(request, response) {
    console.log("Inside GET /users");
    global.db.User.findAll().success(function(users) {
	if (users){
	    var users_json = [];
	    console.log("users = '" + JSON.stringify(users, null, 4) + "'");
	    users.forEach(function(user) {
		users_json.push({id: user.id, email: user.email, password: ph.generate(user.password)});
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
    console.log("Inside GET /user/:email");
    console.log("email = " + request.params.email);
    if (request.params.email){
	global.db.User.find({
	    where: {
		email: request.params.email
	    }
	}).success(function(user) {
            var users_json = [];
            if (user)
	    {
		console.log("user = '" + JSON.stringify(user, null, 4) + "'");
		users_json.push({id: user.id, email: user.email, password: user.password});
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
	response.send("Error: GET missing email");
    }
};

module.exports.add_user = function(request, response) {
    console.log("Inside POST /user");
    console.log("email = " + request.body.email);
    console.log("password = " + request.body.password);
    console.log("body = " + JSON.stringify(request.body, null, 4));
    if (request.body.email && request.body.password){
	global.db.User.create({
            email: request.body.email,
	    password: ph.generate(request.body.password)
	}).error(function(err) {
            console.log(err);
            response.statusCode = 503;
            response.send({
		result: 'error',
		err:    err.code
            });
            //response.send("error retrieving users");
	});
	response.send("POST OK");
    }else{
	response.send("Error: POST missing email and/or password");
    }
};

module.exports.update_user = function(request, response) {
    console.log("Inside PUT /user");
    console.log("email = " + request.body.email);
    console.log("password = " + request.body.password);
    console.log("body = " + JSON.stringify(request.body, null, 4));
    if (request.body.email && request.body.password){
        global.db.User.update(
	    {
		password: ph.generate(request.body.password)
	    },
	    {
		email: request.body.email
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
        response.send("Error: PUT missing email and/or password");
    }
};

module.exports.delete_user = function(request, response) {
    console.log("Inside DELETE /user");
    console.log("email = " + request.body.email);
    console.log("body = " + JSON.stringify(request.body, null, 4));
    if (request.body.email){
        global.db.User.destroy(
            {
                email: request.body.email
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
        response.send("Error: DELETE missing email");
    }
};


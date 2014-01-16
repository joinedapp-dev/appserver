// Define routes for Joinedapp RESAAT service 
var async   = require('async')
  , express = require('express')
  , http    = require('http')
  , https   = require('https')
  , jade    = require('jade')
  , path    = require('path')
  , routes  = require('./routes')
  , uploads = require('./uploads')
  , db      = require('./relational_db')
  , msg     = require('./messaging');

var app = express();
var server = http.createServer(app);

//app.use(express.bodyParser());  // DO NOT define globally, will screw up form/multi-part
//app.use(express.limit('4mb')); // limit file upload sizes to 4mb
app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');
app.set('view engine', 'jade');
app.set("view options", { layout: false });
app.configure(function() {
   app.use(express.static(__dirname + '/public'));
});
app.set('port', process.env.PORT || 8080);

// websocket listen to the same address and port
var io = msg.create(server);

// define routes
app.get('/', express.bodyParser(), routes.site);
app.get('/users', express.bodyParser(), routes.all_users);
app.get('/user/:email', express.bodyParser(), routes.get_user);
app.post('/user', express.bodyParser(), routes.add_user);
app.post('/upload', uploads.add_file);  // form.muti-part do not use bodyParser
app.get(path.resolve("/" + uploads.config.storage.dir.path + ':filename'), express.bodyParser(), uploads.get_file);
app.put('/user', express.bodyParser(), routes.update_user);
app.delete('/user', express.bodyParser(), routes.delete_user);

// start socket events loop
msg.startEventLoop();

// subscribers to pass on to jade template
app.locals.subscribers = [];

// sync the database 
console.log("Syncing relational database...");
db.sequelize.sync().complete(function(err) {
    console.log("Done syncing relational database");
    if (err) {
	console.log("Error syncing relational database");
	throw err;
    } else {
	// find all users
	global.db.User.findAll().success(function(users) {
            if (users){
		console.log("users = '" + JSON.stringify(users, null, 4) + "'");
		users.forEach(function(user) {
		    app.locals.subscribers.push({id: user.id, email: user.email, createdAt: user.createdAt});
		});
            };
	});

	// start listening to clients
	server.listen(app.get('port'), function() {
	    console.log("Listening on " + app.get('port'));
	});

    }
});


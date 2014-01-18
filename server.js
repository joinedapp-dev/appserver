// Define routes for Joinedapp REST service 
var async            = require('async')
  , express          = require('express')
  , http             = require('http')
  , https            = require('https')
  , jade             = require('jade')
  , path             = require('path')
  , routes           = require('./routes')
  , oauth            = require('./oauth')
  , uploads          = require('./uploads')
  , sqldb            = require('./sql_db')
  , nosqldb          = require('./nosql_db')
  , msg              = require('./messaging');

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
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'keyboard cat' }));
    oauth.initialize(app);
    app.use(app.router);
    app.set('port', process.env.PORT || process.env.JOINEDAPP_PORT);
});

// websocket listen to the same address and port
var io = msg.create(server);

// define routes
app.get('/', express.bodyParser(), routes.site);
app.get('/users', express.bodyParser(), routes.all_users);
app.get('/user/:signInId/:signInType', express.bodyParser(), routes.get_user);
app.post('/user', express.bodyParser(), routes.add_user);
app.post('/upload', uploads.add_file);  // form.muti-part do not use bodyParser
app.get(path.resolve("/" + uploads.config.storage.dir.path + ':filename'), express.bodyParser(), uploads.get_file);
app.put('/user', express.bodyParser(), routes.update_user);
app.delete('/user', express.bodyParser(), routes.delete_user);
// for authentication
app.get('/auth/facebook', oauth.auth_facebook, function(req, res){
});
app.get('/auth/facebook/callback', oauth.callback_facebook, function(req, res) {
    console.log("====================== REDIRECTING to /account FROM FACEBOOK");
    res.redirect('/account');
});
app.get('/auth/twitter', oauth.auth_twitter, function(req, res){
});
app.get('/auth/twitter/callback', oauth.callback_twitter, function(req, res){
    console.log("======================== REDIRECTING TO /account FROM TWITTER");
    res.redirect('/account');
});
app.get('/auth/google', oauth.auth_google, function(req, res){
});
app.get('/auth/google/callback', oauth.callback_google, function(req, res) {
    console.log("======================== REDIRECTING TO /account FROM GOOGLE");
    res.redirect('/account');
});
app.get('/account', ensureAuthenticated, function(req, res){
    nosqldb.getItem({
	signInId: req.session.passport.signInId,
	signInType: req.session.passport.signInType
    }, function(err, user){
	if (err){
	    console.log(err);
	}else{
	    res.render('account', { user: user });
	}
    })
});
app.get('/logout', function(request, response){
    request.logout();
    request.session.destroy(function (err) {
	if (err) { throw err;}
	console.log("Successfully logged out ...");
	response.redirect('/'); 
    });
});

// start socket events loop
msg.startEventLoop();

// subscribers to pass on to jade template
app.locals.subscribers = [];

// sync the database 
console.log("Syncing relational database...");
sqldb.sequelize.sync().complete(function(err) {
    console.log("Done syncing relational database");
    if (err) {
	console.log("Error syncing relational database");
	throw err;
    } else {
	// find all users
	sqldb.User.findAll().success(function(users) {
            if (users){
		console.log("users = '" + JSON.stringify(users, null, 4) + "'");
		users.forEach(function(user) {
		    app.locals.subscribers.push({id: user.id, signInId: user.signInId, signInType: user.signInType, createdAt: user.createdAt});
		});
            };
	});

	// start listening to clients
	server.listen(app.get('port'), function() {
	    console.log("Listening on " + app.get('port'));
	});

    }
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/')
}

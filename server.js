// Define routes for Joinedapp RESAAT service 
var async            = require('async')
  , express          = require('express')
  , http             = require('http')
  , https            = require('https')
  , jade             = require('jade')
  , path             = require('path')
  , passport         = require('passport')
  , oauthConfig      = require('./oauth.js')
  , TwitterStrategy  = require('passport-twitter').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , GoogleStrategy   = require('passport-google').Strategy
  , routes           = require('./routes')
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
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.set('port', process.env.PORT || process.env.JOINEDAPP_PORT);
});

// passport stratgies for OAuth
passport.use(new FacebookStrategy({
    clientID: oauthConfig.facebook.clientID,
    clientSecret: oauthConfig.facebook.clientSecret,
    callbackURL: oauthConfig.facebook.callbackURL
    //,profileUrl: "  ..... "
    //,profileFields : ['email', 'first_name', 'last_name']
}, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
	console.log("FACEBOOK PROFILE      : " + JSON.stringify(profile, null, 4));
	console.log("FACEBOOK ACCESS TOKEN : " + accessToken);
	console.log("FACEBOOK REFRESH TOKEN: " + refreshToken); 
	return done(null, profile);
    })
}));
passport.use(new GoogleStrategy({
    returnURL: oauthConfig.google.returnURL,
    realm: oauthConfig.google.realm
}, function(identifier, profile, done) {
    process.nextTick(function(){
	profile.identifier = identifier;
	console.log("GOOGLE PROFILE: " + JSON.stringify(profile, null, 4));
	return done(null, profile);
    })
}));
passport.use(new TwitterStrategy({
    consumerKey:    oauthConfig.twitter.consumerKey,
    consumerSecret: oauthConfig.twitter.consumerSecret,
    callbackURL:    oauthConfig.twitter.callbackURL
}, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function(){
	console.log("TWITTER PROFILE      : " + JSON.stringify(profile, null, 4));
	console.log("TWITTER ACCESS TOKEN : " + accessToken);
	console.log("TWITTER REFRESH TOKEN: " + refreshToken); 
	return done(null, profile);
    })
}))
	     
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
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
app.get('/auth/facebook', passport.authenticate('facebook'), function(req, res){
});
app.get('/auth/facebook/callback', passport.authenticate('facebook', { 
    successRedirect: '/',
    failureRedirect: '/login'
}), function(req, res) {
    res.redirect('/account');
});
app.get('/auth/twitter', passport.authenticate('twitter'), function(req, res){
});
app.get('/auth/twitter/callback', passport.authenticate('twitter', { 
    successRedirect: '/',
    failureRedirect: '/login' 
}));
app.get('/auth/google', passport.authenticate('google'), function(req, res){
});
app.get('/auth/google/callback', passport.authenticate('google', { 
    successRedirect: '/',
    failureRedirect: '/loging'
}), function(req, res) {
    res.redirect('/account');
});
app.get('/account', ensureAuthenticated, function(req, res){
    res.render('account', { user: req.user });
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



// XXX TO BE REMOVED LATER
// list all nosql tables
nosqldb.listTables(function(err, data) {
    if (err){
	console.log("Eror in reading list of nosql tables: " + err);
	return;
    }
    if (data && data.TableNames){
	console.log("TABLE NAMES FROM DYNAMODB ARE: " + data.TableNames);
    }
});


















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

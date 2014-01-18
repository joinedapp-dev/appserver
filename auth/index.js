// dependencies
var passport         = require('passport')
  , LocalStrategy    = require('passport-local').Strategy
  , TwitterStrategy  = require('passport-twitter').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , LinkedInStrategy = require('passport-linkedin').Strategy
  , GoogleStrategy   = require('passport-google').Strategy
  , ph               = require('password-hash')
  , nosqldb          = require('../nosql_db');

var ids = {
    facebook: {
	clientID: process.env.FACEBOOK_CONSUMER_KEY,
	clientSecret: process.env.FACEBOOK_CONSUMER_SECRET,
	callbackURL: "http://" + process.env.JOINEDAPP_HOSTNAME + ":" + process.env.JOINEDAPP_PORT + "/auth/facebook/callback"
    },
    twitter: {
	consumerKey: process.env.TWITTER_CONSUMER_KEY,
	consumerSecret: process.env.TWITTER_CONSUMER_SECRET, 
	callbackURL: "http://" + process.env.JOINEDAPP_HOSTNAME + ":" + process.env.JOINEDAPP_PORT + "/auth/twitter/callback"
    },
    linkedin: {
	apiKey: process.env.LINKEDIN_API_KEY,
	secretKey: process.env.LINKEDIN_SECRET_KEY,
	callbackURL: "http://" + process.env.JOINEDAPP_HOSTNAME + ":" + process.env.JOINEDAPP_PORT + "/auth/linkedin/callback"
    },
    google: {
	returnURL: "http://" + process.env.JOINEDAPP_HOSTNAME + ":" + process.env.JOINEDAPP_PORT + "/auth/google/callback",
	realm: "http://" + process.env.JOINEDAPP_HOSTNAME + ":" + process.env.JOINEDAPP_PORT
    }
}

var getId = function(oauth_method, profile){
    if (oauth_method=='FACEBOOK'){
	return profile.id;
    }else if(oauth_method=='GOOGLE'){
	return profile.identifier;
    }else if(oauth_method=='TWITTER'){
	return profile.id;
    }else if(oauth_method=='LINKEDIN'){
	return profile.id;
    }else{
	throw("Error: Unsupported OAuth service");
    }
}

var createUserSession = function(oauth_method){
    return function(accessToken, refreshToken, profile, done){
	nosqldb.sessionTable.getItem({
	    signInId: getId(oauth_method, profile),
	    signInType: oauth_method
	}, function(err, user){
	    if (err){
		console.log("Error trying to find " + oauth_method + " user in NOSQL table: " + err);
	    }
	    if (!err && user!=null){
		done(null, user);
	    }else{
		nosqldb.sessionTable.putItem({
		    signInId: getId(oauth_method, profile),
		    signInType: oauth_method,
		    authToken: accessToken
		}, function(err){
		    if (err){
			console.log("Error saving " + oauth_method + " user to NOSQL db: " + err);
		    }else{
			console.log("Done saving " + oauth_method + " user to NOSQL db");
			done(null, user);
		    }
		});
	    }
	});
    }
}    

var createGoogleUserSession = function(){
    return function(identifier, profile, done){
	nosqldb.sessionTable.getItem({
	    signInId: profile.identifier,
	    signInType: 'GOOGLE'
	}, function(err, user){
	    if (err){
		console.log("Error trying to find GOOGLE user in NOSQL table: " + err);
	    }
	    if (!err && user!=null){
		done(null, user);
	    }else{
		nosqldb.sessionTable.putItem({
		    signInId: profile.identifier,
		    signInType: 'GOOGLE',
		    authToken: 'NA'
		}, function(err){
		    if (err){
			console.log("Error saving GOOGLE user to NOSQL db: " + err);
		    }else{
			console.log("Done saving GOOGLE user to NOSQL db");
			done(null, user);
		    }
		});
	    }
	});
    }
}    

// passport strategy for local email/password
// passport config
passport.use(new LocalStrategy(function(email, password, done){
    console.log("===================INSIDE localstrategy");
    nosqldb.sessionTable.getItem({
	signInId: email,
	signInType: 'EMAIL'
    }, function(err, user){
	if (err){
	    console.log("Error trying to find EMAIL user in NOSQL table: " + err);
	    done(err);
	}
	if (!user){
	    console.log("=================Email not found");
	    return done(null, false, {info: 'Incorrect email.'});
	}
	if (ph.validate(ph.generate(password), user.authToken)){
	    console.log("==================Correct match");
	    return done(null, user);
	}
	console.log("==================== Incorrect password");
	return done(null, false, { info: 'Incorrect password'});
    })
}));
	
module.exports.register_account = function(req, res){
    console.log("REGISTER POST: " + JSON.stringify(req.body, null, 4));
    nosqldb.sessionTable.getItem({
	signInId: req.body.email,
	signInType: 'EMAIL'
    }, function(err, user){
	if (err){
	    console.log("Error trying to find user in NOSQL table: " + err);
	    return res.render("register", {info: "Something bad happened... error trying to access database"});
	}
	if (user){
	    return res.render("register", {info: "Sorry.  That email is already in use"});
	}
	console.log("=============" + req.body.email);
	console.log("=============" + ph.generate(req.body.password));
	nosqldb.sessionTable.putItem({
	    signInId: req.body.email,
	    signInType: 'EMAIL',
	    authToken: ph.generate(req.body.password)
	}, function(err, user2){
	    if (err){
		console.log("Error trying to add user to NOSQL table: " + err);
		return res.render("register", {info: "Empty email/password. Please enter email and password"});
	    }
	    console.log("PUT ITEM WAS SUCCESSFUL IN REGISTRATION");
	    passport.authenticate('local', function(err){
		console.log("AUTHENTICATE IS DONE");
	    });
	    res.render("login");
	    
	})
    })
}

module.exports.auth_local = function(){
    console.log("INSIDE auth_local");
    return passport.authenticate('local');
}

// passport stratgies for OAuth
passport.use(new FacebookStrategy({
    clientID: ids.facebook.clientID,
    clientSecret: ids.facebook.clientSecret,
    callbackURL: ids.facebook.callbackURL
}, createUserSession('FACEBOOK')));

passport.use(new TwitterStrategy({
    consumerKey:    ids.twitter.consumerKey,
    consumerSecret: ids.twitter.consumerSecret,
    callbackURL:    ids.twitter.callbackURL
}, createUserSession('TWITTER')));

passport.use(new LinkedInStrategy({
    consumerKey:    ids.linkedin.apiKey,
    consumerSecret: ids.linkedin.secretKey,
    callbackURL:    ids.linkedin.callbackURL
}, createUserSession('LINKEDIN')));

passport.use(new GoogleStrategy({
    returnURL: ids.google.returnURL,
    realm: ids.google.realm
}, createGoogleUserSession()));

passport.serializeUser(function(user, done) {
    console.log('serializeUser: (' + user.signInId + ',' + user.signInType + ')');
    done(null, {
	signInId: user.signInId, 
	signInType: user.signInType
    });
});

passport.deserializeUser(function(user, done) {
    console.log('DEserializeUser: (' + user.signInId + ',' + user.signInType + ')');
    nosqldb.sessionTable.getItem({
        signInId: user.signInId,
        signInType: user.signInType
    }, function(err, user2){
	console.log("DONE Deserialization: " + JSON.stringify(user2, null, 4));
        if (err){
	    console.log("Error in deserialization: " + err);
	    done(err, null);
	}else{
	    done(null, user2);
	}
    })
});

module.exports.initialize = function(app){
    app.use(passport.initialize());
    app.use(passport.session());
}
module.exports.auth_facebook = passport.authenticate('facebook');
module.exports.callback_facebook = passport.authenticate('facebook', { 
    failureRedirect: '/'
});

module.exports.auth_twitter = passport.authenticate('twitter');
module.exports.callback_twitter = passport.authenticate('twitter', { 
    failureRedirect: '/' 
});

module.exports.auth_linkedin = passport.authenticate('linkedin');
module.exports.callback_linkedin = passport.authenticate('linkedin', { 
    failureRedirect: '/' 
});

module.exports.auth_google = passport.authenticate('google');
module.exports.callback_google = passport.authenticate('google', { 
    failureRedirect: '/'
});

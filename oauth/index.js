// dependencies
var passport         = require('passport')
  , TwitterStrategy  = require('passport-twitter').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , GoogleStrategy   = require('passport-google').Strategy
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
		    oauthToken: accessToken
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
		    oauthToken: 'NA'
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


// passport stratgies for OAuth
passport.use(new FacebookStrategy({
    clientID: ids.facebook.clientID,
    clientSecret: ids.facebook.clientSecret,
    callbackURL: ids.facebook.callbackURL
}, createUserSession('FACEBOOK')));


passport.use(new GoogleStrategy({
    returnURL: ids.google.returnURL,
    realm: ids.google.realm
}, createGoogleUserSession()));

passport.use(new TwitterStrategy({
    consumerKey:    ids.twitter.consumerKey,
    consumerSecret: ids.twitter.consumerSecret,
    callbackURL:    ids.twitter.callbackURL
}, createUserSession('TWITTER')));

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
    successRedirect: '/',
    failureRedirect: '/login'
});

module.exports.auth_twitter = passport.authenticate('twitter');
module.exports.callback_twitter = passport.authenticate('twitter', { 
    successRedirect: '/',
    failureRedirect: '/login' 
});

module.exports.auth_google = passport.authenticate('google');
module.exports.callback_google = passport.authenticate('google', { 
    successRedirect: '/',
    failureRedirect: '/login'
});




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

module.exports = ids

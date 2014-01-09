// Define routes for Joinedapp REST service 
var async   = require('async')
  , express = require('express')
  , http    = require('http')
  , https   = require('https')
  , routes  = require('./routes')
  , db      = require('./relational_db');

var app = express();

app.use(express.bodyParser());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 8080);

// Render homepage (note trailing slash) joinedapp.com/
app.get('/', routes.site);
app.get('/users', routes.all_users);
app.get('/user/:email', routes.get_user);
app.post('/user', routes.add_user);
app.put('/user', routes.update_user);
app.delete('/user', routes.delete_user);

// sync the database 
console.log("Syncing relational database...");
db.sequelize.sync().complete(function(err) {
    console.log("Done syncing relational database");
    if (err) {
	console.log("Error syncing relational database");
	throw err;
    } else {
	http.createServer(app).listen(app.get('port'), function() {
	    console.log("Listening on " + app.get('port'));
	});
    }
});


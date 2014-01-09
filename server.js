// Define routes for Joinedapp REST service 
var async   = require('async')
  , express = require('express')
  , http    = require('http')
  , https   = require('https')
  , jade    = require('jade')
  , routes  = require('./routes')
  , db      = require('./relational_db');

var app = express();
var server = http.createServer(app);

app.use(express.bodyParser());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
//app.set('view engine', 'jade');
app.set("view options", { layout: false });
app.configure(function() {
   app.use(express.static(__dirname + '/public'));
});
app.set('port', process.env.PORT || 8080);

// websocket listen to the same address and port
var io = require('socket.io').listen(server);

// define routes
app.get('/', routes.site);
app.get('/users', routes.all_users);
app.get('/user/:email', routes.get_user);
app.post('/user', routes.add_user);
app.put('/user', routes.update_user);
app.delete('/user', routes.delete_user);

// define socket events
// The first event we will use is the connection event. It is fired when a
// client tries to connect to the server; Socket.io creates a new socket that 
// we will use to receive or send messages to the client.
var users = 0;
var pseudoArray = ['admin'];  // block the admin username
io.sockets.on('connection', function (socket) { // First connection
    users += 1; // Add 1 to the count
    reloadUsers(); // Send the count to all the users
    socket.on('message', function (data) { // Broadcast the message to all
        if(pseudoSet(socket))
        {
            var transmit = {date : new Date().toISOString(), pseudo : returnPseudo(socket), message : data};
            socket.broadcast.emit('message', transmit);
            console.log("user "+ transmit['pseudo'] +" said \""+data+"\"");
        }
    });
    socket.on('setPseudo', function (data) { // Assign a name to the user
        if (pseudoArray.indexOf(data) == -1) // Test if the name is already taken
        {
            socket.set('pseudo', data, function(){
                pseudoArray.push(data);
                socket.emit('pseudoStatus', 'ok');
                console.log("user " + data + " connected");
            });
        }
        else
        {
            socket.emit('pseudoStatus', 'error') // Send the error
        }
    });
    socket.on('disconnect', function () { // Disconnection of the client
        users -= 1;
        reloadUsers();
        if (pseudoSet(socket))
        {
            var pseudo;
            socket.get('pseudo', function(err, name) {
                pseudo = name;
            });
            var index = pseudoArray.indexOf(pseudo);
            pseudo.slice(index - 1, 1);
        }
    });
});

function reloadUsers() { // Send the count of the users to all
    io.sockets.emit('nbUsers', {"nb": users});
}

function pseudoSet(socket) { // Test if the user has a name
    var test;
    socket.get('pseudo', function(err, name) {
        if (name == null ) test = false;
        else test = true;
    });
    return test;
}

function returnPseudo(socket) { // Return the name of the user
    var pseudo;
    socket.get('pseudo', function(err, name) {
        if (name == null ) pseudo = false;
        else pseudo = name;
    });
    return pseudo;
}

// sync the database 
console.log("Syncing relational database...");
db.sequelize.sync().complete(function(err) {
    console.log("Done syncing relational database");
    if (err) {
	console.log("Error syncing relational database");
	throw err;
    } else {
	server.listen(app.get('port'), function() {
	    console.log("Listening on " + app.get('port'));
	});
    }
});


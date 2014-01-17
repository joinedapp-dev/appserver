var io;

module.exports.create = function(server){
    io = require('socket.io').listen(server);
    return io;
}

module.exports.io = io;

module.exports.updateTable = function(id, signInId, signInType, createdAt){
    console.log("Sending message to updateTable on website");
    io.sockets.emit('newSubscribedUser', {
	id: id, 
	signInId: signInId,
	signInType: signInType,
	createdAt: createdAt
    });
};

module.exports.updateFileSubmissionProgress = function(percentage){
    console.log("Files progress: " + percentage);
    // need username here to emit to the right client
}

var users = 0;
var pseudoArray = ['admin'];  // block the admin username

module.exports.startEventLoop = function(){
    // define socket events
    // The first event we will use is the connection event. It is fired when a
    // client tries to connect to the server; Socket.io creates a new socket that 
    // we will use to receive or send messages to the client.
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
};

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

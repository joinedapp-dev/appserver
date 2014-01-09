var socket = io.connect();

console.log("Inside script.js");

function addMessage(msg, pseudo) {
    $("#chatEntries").append('<div class="message"><p>' + pseudo + ' : ' + msg + '</p></div>');
}

function sentMessage() {
    if ($('#messageInput').val() != "") 
    {
	socket.emit('message', $('#messageInput').val());
	addMessage($('#messageInput').val(), "Me", new Date().toISOString(), true);
	$('#messageInput').val('');
    }
}

function setPseudo() {
   if ($("#pseudoInput").val() != "")
    {
	socket.emit('setPseudo', $("#pseudoInput").val());
	$('#chatControls').show();
	$('#pseudoInput').hide();
	$('#pseudoSet').hide();
    }
}

socket.on('nbUsers', function(msg) {
    $("#nbUsers").html(msg.nb);
});

socket.on('message', function(data) {
    addMessage(data['message'], data['pseudo']);
});

$(function() {
    $("#chatControls").hide();
    $("#nbUsers").html(0);
    $("#pseudoSet").click(function() {setPseudo()});
    $("#submit").click(function() {sentMessage();});
});

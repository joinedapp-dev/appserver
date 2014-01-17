var socket = io.connect();

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

socket.on('newSubscribedUser', function(data){
    // add row to table
    $('#subscriberTable tr:last').after('<tr><td>'+data.id+'</td><td>'+data.signInId +'</td><td>'+data.signInType+'</td><td>'+data.createdAt+'</td></tr><');
});

socket.on('nbUsers', function(msg) {
    $("#nbUsers").html(msg.nb);
});

socket.on('message', function(data) {
    addMessage(data['message'], data['pseudo']);
});

var resizeImage = function(filename, image_type, maxwidth, maxheight){
    console.log("hello 1");
    var reader = new FileReader();
    console.log("hello 1.1");
    
    reader.onload = function() {
	console.log("hello 4.1");
	
	var image = new Image();
	image.src = reader.result;
	console.log("hello 4.2");
	
	image.onload = function() {
	    console.log("hello 4.3");
	    
            var origwidth = image.width,
            origheight = image.height;
            if (origwidth > origheight) {
		if (origwidth > maxwidth) {
                    origheight *= maxwidth / origwidth;
                    origwidth = maxwidth;
		}
            }
            else {
		if (origheight > maxheight) {
                    origwidth *= maxheight / origheight;
                    origheight = maxheight;
		}
            }
	    console.log("hello 2");
	    
            var canvas = document.createElement('canvas');
            canvas.width = origwidth;
            canvas.height = origheight;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0, origwidth, origheight);
            console.log("hello 3");

	    var newfile = canvas.toDataURL(image_type, 0.5); // The resized file ready for upload
	    
	    // create a form programmatically and submit it
	    document.getElementById('userPhotoInput').value = newFile;
	    //console.log("canvas.toDataURL(image_type, 0.5) = " + canvas.toDataURL(image_type, 0.5));
	    //document.forms["form1"].submit();
            //document.getElementById("uploadPreview").src = newfile;
            //document.getElementById("hiddenfile").value = newfile;
	}
    }
    console.log("hello 4");
    reader.readAsDataURL(filename);    
}

var upload = function(){
    var photo = document.getElementById("photo");
    var file  = photo.files[0];
    
    var preview = document.getElementById("preview");
    preview.src = file.getAsDataURL();
    return _resize(preview);
}

var _resize = function(img, maxWidth, maxHeight) {
    var ratio = 1;
    
    var canvas = document.createElement("canvas");
    canvas.style.display="none";
    document.body.appendChild(canvas);
    
    var canvasCopy = document.createElement("canvas");
    canvasCopy.style.display="none";
    document.body.appendChild(canvasCopy);
    
    var ctx = canvas.getContext("2d");
    var copyContext = canvasCopy.getContext("2d");
    
    if(img.width > maxWidth)
        ratio = maxWidth / img.width;
    else if(img.height > maxHeight)
        ratio = maxHeight / img.height;
    
    canvasCopy.width = img.width;
    canvasCopy.height = img.height;
    try {
        copyContext.drawImage(img, 0, 0);
    } catch (e) { 
        document.getElementById('loader').style.display="none";
	//        alert("There was a problem - please reupload your image");
        return false;
    }
    
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    // the line to change
    //ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);
    // the method signature you are using is for slicing
    ctx.drawImage(canvasCopy, 0, 0, canvas.width, canvas.height);
    
    var dataURL = canvas.toDataURL("image/png");
    
    document.body.removeChild(canvas);
    document.body.removeChild(canvasCopy);
    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
};

var resize = function(){ 
    var photo = document.getElementById("photo");
    if(photo.files!=undefined){ 
	
        var loader = document.getElementById("loader");
        loader.style.display = "inline";
	
        var file  = photo.files[0];
        document.getElementById("orig").value = file.fileSize;
        var preview = document.getElementById("preview");
        var r = new FileReader();
        r.onload = (function(previewImage) { 
            return function(e) { 
                var maxx = document.getElementById('maxx').value;
                var maxy = document.getElementById('maxy').value;
                previewImage.src = e.target.result; 
                previewImage.onload = function() {
                    var k = _resize(previewImage, maxx, maxy);
                    if (k != false) { 
                        document.getElementById('base64').value= k;
                        document.getElementById('upload').submit();
                    } else {
                        alert('problem - please attempt to upload again');
                    }
                }
            }; 
        })(preview);
        r.readAsDataURL(file);
    } else {
        alert("Seems your browser doesn't support resizing");
    }
    return false;
}


$(function() {
    $("#chatControls").hide();
    $("#nbUsers").html(0);
    $("#pseudoSet").click(function() {setPseudo()});
    $("#submit").click(function() {sentMessage();});

    $('#uploadForm').submit(function(event) {

	//alert("submit was clicked!");

	javascript: console.log("===== Uploading the file");

	// get image from form and resize it (make sure it is a fixed pixel size...)
	javascript: console.log("=====" + JSON.stringify($("#userPhotoInput").prop("files")));
	if ($("#userPhotoInput").prop("files").length > 0){

	    // information on file to be uploaded:
	    javascript: console.log("Uploaded file info: ");
	    javascript: console.log(JSON.stringify($("#userPhotoInput").prop("files")[0], null, 4));
	    javascript: console.log("\tname = " + $("#userPhotoInput").prop("files")[0].name);
	    javascript: console.log("\ttype = " + $("#userPhotoInput").prop("files")[0].type);
	    javascript: console.log("\tsize = " + $("#userPhotoInput").prop("files")[0].size);
	    
	    var image_type = $("#userPhotoInput").prop("files")[0].type;
	    var image_name = $("#userPhotoInput").prop("files")[0].name;
	    if (image_type != "image/png" && image_type != "image/jpeg"){
		alert("Image needs to be png or jpeg format");
		event.preventDefault();
		return false;
	    }
	    
	    // resize image
	    //resizeImage(image_name, image_type, 50, 50);
	    //return false;

	    $(this).ajaxSubmit({                                                                                                                 
		
		error: function(xhr) {
		    console.log('Error xhr: ' + JSON.stringify(xhr));
		},
		
		success: function(response) {
		    if(response.error) {
			console.log('Opps, something bad happened');
			return;
		    }
		    
		    var imageUrlOnServer = response.filepath;
		    //alert("IMAGE PATH = " + imageUrlOnServer);
		    console.log("image path = " + imageUrlOnServer);
		    $("#uploadStatus").text("Success, file uploaded to: '" + imageUrlOnServer + "'");
		    $("#uploadedImage").attr("src",imageUrlOnServer);
		}
	    });	
	}
	// Have to stop the form from submitting and causing                                                                                                       
	// a page refresh - don't forget this                                                                                                                      
	event.preventDefault();
	//return false;
	
    });
});



// Define routes for Joinedapp REST service 
var fs      = require('fs')
  , form    = require('formidable')
  , path    = require('path')
  , Alleup  = require('alleup')
  , msg     = require('../messaging')
  , db      = require('../relational_db');

var alleup = new Alleup({storage : "aws", config_file: __dirname + "/alleup_config.json"})

module.exports.add_file = function(request, response){
    console.log("Inside add_file");

    var f = new form.IncomingForm(/* {uploadDir: __dirname + '../data'} */);

    f
	.on('error', function(err) {
            throw err;
	})

	.on('field', function(field, value) {
            //receive form fields here
	})

        // this is where the renaming happens 
	.on ('fileBegin', function(name, file){
            //rename the incoming file to the file's name
            //file.path = form.uploadDir + "/" + file.name;
	    if (!file.name){
		// file name not specified
	    }else{
		console.log("+++++++++++++++ FILENAME = " + file.name);
	    }
	})

	.on('file', function(field, file) {
            //On file received
	})

	.on('progress', function(bytesReceived, bytesExpected) {
	    var progress = {
		type: 'progress',
		bytesReceived: bytesReceived,
		bytesExpected: bytesExpected
	    };
	    msg.updateFileSubmissionProgress(100*bytesReceived/bytesExpected);
	    console.log("Progress: " + JSON.stringify(progress) + " in percentage: " + 100*bytesReceived/bytesExpected);
	})
    
	.on('end', function() {
	    console.log("done file tranfer");
	});

    // loading directly to S3
/*    
    alleup.upload(req, res, function(err, file, res){
	
	console.log("FILE UPLOADED: " + file);
	// THIS YOU CAN SAVE FILE TO DATABASE FOR EXAMPLE
	res.end();
    });
*/

    f.parse(request, function(err, fields, files) {
	console.log("fields = " + JSON.stringify(fields));
	console.log("files = " + JSON.stringify(files));
	if (!files.upload){
	    response.send({
		error: 'Filename is empty'
            });
            console.log("Error filename empty");
	    return;
	}

	//response.writeHead(200, {'content-type': 'text/plain'});
	var destination = "/data/" + path.basename(files.upload.path) + path.basename(files.upload.name);
	fs.rename(files.upload.path, __dirname + "/../" + destination, function(err){
	    if (err){
		response.send({
                    error: 'Ah crap! Something bad happened copying file on server'
		});
		console.log("Error in rename: " + err);
		return;
	    }
	    console.log("\tFROM: " + files.upload.path);
	    console.log("\tTO  : " + __dirname + "/../" + destination);
	    console.log(JSON.stringify({filepath: destination}));
	    response.send({filepath: destination});
	});
    });
};

module.exports.get_file = function(request, response){
    var fname = __dirname + "/../data/" + request.params.filename;
    console.log("filename = " + fname);
    response.sendfile(path.resolve(fname));
}

// Define routes for Joinedapp REST service AAA
var fs      = require('fs')
  , form    = require('formidable')
  , path    = require('path')
  , Alleup  = require('alleup')
  , mime    = require('mime')
  , AWS     = require('../aws')
  , msg     = require('../messaging')
  , db      = require('../sql_db');


// create config file for uploading to S3 bucket
var config = JSON.parse(fs.readFileSync(__dirname + "/alleup_config.json.0"));
console.log("CONFIG FILE = " + JSON.stringify(config, null, 4));
config.storage.aws.key = process.env.AWS_ACCESS_KEY_ID;
config.storage.aws.secret = process.env.AWS_SECRET_ACCESS_KEY;
fs.writeFileSync(__dirname + "/alleup_config.json", JSON.stringify(config, null, 4));

module.exports.config = config;

// create aws S3 object
var s3 = new AWS.S3();

// create alleup object
var alleup = new Alleup({storage : "dir", config_file: __dirname + "/alleup_config.json"})

var uploadToS3 = function(file_to_upload, callback){
    console.log("going into readFile");
    
    fs.readFile(file_to_upload, function (err, data) {
	if (err){ 
	    callback("Failed to load file with error: " + err);
	}
	console.log("Going into s3 putObject()");
	var mime_type = mime.lookup(file_to_upload);
	var file_path = path.normalize(config.storage.dir.path + "/" + path.basename(file_to_upload));
	var body_stream = fs.createReadStream(file_to_upload);
	console.log("=============================== mime type = " + mime_type);
	console.log("=============================== file path = " + file_path);
	s3.client.putObject({
	    Bucket: 'com-joinedapp-uploads',
	    Key: file_path,
	Body: body_stream
	}, function(err2, data2){
	    if (err2) {
		callback("Failed to upload file to S3 with error: " + err2);
	    }else{
		callback();
	    }
	});
    });
}

// get list of S3 buckets
var listS3Buckets = function(){
    s3.listBuckets(function(err, data){
	if (err){
	    console.log("S3 error: " + err);
	    return;
	}else{
	    for (var index in data.Buckets){
		var bucket = data.Buckets[index];
		console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
	    }
	    return data.Buckets;
	}
    });
}

module.exports.add_file = function(request, response){
    console.log("inside add file");
    
    // uploading, resizing and then moving to S3
    alleup.upload(request, response, function(err, file, response){
	if (err){
	    console.log("alleup error: " + err);
	    response.send({error: err});
	}else{
            console.log("alleup successfull: " + file);
	    // find all files resized and cropped
	    var files_to_be_uploaded = [];
	    fs.readdir(config.storage.dir.path, function(err, files) {
		if (err){
		    console.log("Cannot list directory: " + config.storage.dir.path);
		    return;
		}
		files.filter(function(f){
		    return f.match(file + "$");
		})
		    .forEach(function(f){
			files_to_be_uploaded.push(path.resolve(__dirname + "/../public/images/" + f));
		    })

		for (var i in files_to_be_uploaded){
		    console.log("FILE: " + files_to_be_uploaded[i]);
		}
		
		var num_uploads = 0;
		var s3_upload_callback = function(err){
		    if (err){
			console.log("Error in uploading to S3 bucket: " + err);
			response.send({filepath: "", error: err});
			return;
		    }else{
			// delete local file
			console.log("Deleting file " + files_to_be_uploaded[num_uploads]);
			fs.unlink(files_to_be_uploaded[num_uploads], function(err){
			    if (err){
				console.log("Error deleting uploaded file: " + err);
				throw err;
			    }
			});
			++num_uploads;
			if (num_uploads == files_to_be_uploaded.length){
			    var params = {Bucket: 'com-joinedapp-uploads', Key: "public/images/preview_" + file, Expires: 900};
			    s3.getSignedUrl('getObject', params, function (err3, url) {
				if (err3){
				    console.log("ERROR: " + err3);
				    response.send({filepath: "", error: err3});
				}
				console.log("The URL is", url);
				response.send({filepath: url /*config.storage.dir.path + "preview_" + file*/, error: ""});
			    });
			}else{
			    uploadToS3(path.resolve(files_to_be_uploaded[num_uploads]), s3_upload_callback);
			}
		    }
		}
		
		if (files_to_be_uploaded.length >0)
		{
		    // upload files to S3 one after the other
		    uploadToS3(path.resolve(files_to_be_uploaded[0]), s3_upload_callback);
		}
	    })
	}
    });

/*
    // uploading to file system and then moving it
    var f = new form.IncomingForm(// {uploadDir: __dirname + '../data'} 
                                  );

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
*/
};

module.exports.get_file = function(request, response){
    var fname = __dirname + "/../" + config.storage.dir.path + "/" + request.params.filename;
    console.log("filename = " + fname);
    response.sendfile(path.resolve(fname));
}

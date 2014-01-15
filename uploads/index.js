// Define routes for Joinedapp REST service AAA
var fs      = require('fs')
  , form    = require('formidable')
  , path    = require('path')
  , Alleup  = require('alleup')
  , AWS     = require('aws-sdk')
  , mime    = require('mime')
  , msg     = require('../messaging')
  , db      = require('../relational_db');


// create config file for uploading to S3 bucket
var config = JSON.parse(fs.readFileSync(__dirname + "/alleup_config.json.0"));
console.log("CONFIG FILE = " + JSON.stringify(config, null, 4));
config.storage.aws.key = process.env.AWS_ACCESS_KEY_ID;
config.storage.aws.secret = process.env.AWS_SECRET_ACCESS_KEY;
fs.writeFileSync(__dirname + "/alleup_config.json", JSON.stringify(config, null, 4));

module.exports.config = config;



// creae aws S3 object'
//AWS.config.region = 'us-west-2';
AWS.config.update({ accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
		    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY });
var s3 = new AWS.S3();
console.log("going into readFile");
var file_to_upload = __dirname + "/../public/images/preview_1389731399517.jpg";
fs.readFile(file_to_upload, function (err, data) {
    if (err) { throw err; }
    console.log("Going into s3 putObject()");
    var mime_type = mime.lookup(file_to_upload);
    var file_path = path.normalize(config.storage.dir.path + "/" + path.basename(file_to_upload));
    console.log("=============================== mime type = " + mime_type);
    console.log("=============================== file path = " + file_path);
    s3.client.putObject({
	Bucket: 'com-joinedapp-uploads',
	Key: file_path,
//	ContentType: mime_type,
	Body: data
    }, function(err2, data2){
	if (err2) {
	    console.log("++++++++++++++++++++++++++++++ Error in putObject: " + err2);
	}else{
	    console.log("++++++++++++++++++++++++++++++ putObject succeeded");
	}
    });
//.success(function(resp){
//	console.log("Successfully uploaded package.");
  //  });
});

// create alleup object
var alleup = new Alleup({storage : "dir", config_file: __dirname + "/alleup_config.json"})


s3.listBuckets(function(err, data){
    if (err){
	console.log("S3 error: " + err);
    }else{
	for (var index in data.Buckets){
	    var bucket = data.Buckets[index];
	    console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
	}
    }
});
/*
var file_source = fs.createReadStream(__dirname + "/../public/images/preview_1389731399517.jpg");
var s3_stream = s3.getObject({Bucket: 'com-joinedapp-uploads', Key: "myimage.jpg"}).createWriteStream();
file_source.pipe(s3_stream);
*/
/*
~s3_stream.pipe(file_source);
s3_stream.on('error', function(err){
    console.log("S3 STREAM ERROR: " + err);
});
s3_stream.on('close', function(){
    console.log("============ DONE");
});
*/

//s3.getObject({Bucket: 'com-joinedapp-uploads', Key: "myimage.jpg"}).createReadStream().pipe(file_source);
 


module.exports.add_file = function(request, response){
    console.log("inside add file");

    // uploading, resizing and then moving to S3
    alleup.upload(request, response, function(err, file, response){
	if (err){
	    console.log("alleup upload error: " + err);
	    response.send({error: err});
	}else{
            console.log("Successfully uploaded: " + file);
	    response.send({filepath: config.storage.dir.path + "preview_" + file, error: ""});
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

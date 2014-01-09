var express = require('express');
var mysql = require('mysql');
var fs = require('fs');
var path = require('path');

var app = express();
app.use(express.logger());

var Sequelize = require('sequelize');
var sq = null;

if (process.env.DATABASE_URL) {
    /* Remote database
       We will be parsing a connection
       string of the form:
       mysql://<username>:<password>@<host>:<port>/<dbname>
    */
    var sqlregex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    console.log("Parsing: '" + process.env.DATABASE_URL + "'");
    var match = process.env.DATABASE_URL.match(sqlregex);
    if (match && match.length == 6) {
	console.log("LENGTH=" + match.length);
	var user = match[1];
	var password = match[2];
	var host = match[3];
	var port = match[4];
	var dbname = match[5];
	
	// output parsed values for connecting to mysql database
	console.log("user = '" + user + "'");
	console.log("password = '" + "..." /* password */ + "'");
	console.log("host = '" + host + "'");
	console.log("port = '" + port + "'");
	console.log("dbname = '" + dbname + "'");
	
	
        // using sequelize ...        
        var config =  {
            dialect:  'mysql',
            protocol: 'mysql',
            port:     port,
            host:     host
            //logging:  true //false
        };
	// connect to database
	sq = new Sequelize(dbname, user, password, config);
	// check connection
	sq.query('SHOW TABLES').success(function(result) {
	    console.log("MySQL database connect succeeded, list of tables:\n\t" + result);
	    for (var i in result){
		console.log("Table '" + result[i] + "':");
		var q = "DESCRIBE " + result[i];
		sq.query(q).success(function(schema){
		    console.log(JSON.stringify(schema, null, 4));
		}).error(function(err){
		    console.log("ERR: Cannot get schema with error '" + err + "'");
		});
	    }
	}).error(function(err) {
	    console.log("MySQL database connection failed with error '" + err + "'");
	});

/*
	// using node-mysql ...
	var config =  {
            host: host,
            user: user,
            password: password,
            database: dbname
        };
	// connect to database
	sq = mysql.createPool(config);
	// check connection
	sq.getConnection(function(err, connection) {
	    if (err){
		console.log("MySQL database connection failed with error: '" + err + "'");
	    }else{
		// Use the connection
		var q = connection.query( 'SHOW TABLES', function(err, res) {
		    if (err){
			console.log("MySQL database query failed with error: '" + err + "'");
			console.log("\tYour bad query: '" + q.sql + "'");
		    }else{
			console.log("MySQL database connect succeeded, list of tables:\n\t" + JSON.stringify(res));
		    }
		    // And done with the connection.
		    connection.release();
		    
		    // Don't use the connection here, it has been returned to the pool.
		});
	    }
	});
*/

	global.db = {
            Sequelize: Sequelize,
            sequelize: sq,
            User: sq.import(__dirname + '/user')
	};
    } else {
	console.log("ERROR: Unable to parse env variable 'DATABASE_URL'...");
	console.log("       Required format: 'mysql://<username>:<password>@<host>:<port>/<dbname>'");
    }
} else {
    console.log("ERROR: Cannot find env variable 'DATABASE_URL' for MySQL info");
}

/*
// create tables
var dir = __dirname + '/schema/';
var files = fs.readdirSync(dir);
for(var i in files){
    console.log(files[i]);
    if (path.extname(files[i]) == ".sql"){
	console.log("===" + dir + files[i]);
    }
    var schema = fs.readFileSync(dir + files[i], 'utf8');
    if (schema){
	console.log("SCHEMA = " + schema);
	sq.query(schema).success(function(result) {
            console.log("Successfully created table");
	}).error(function(err) {
            console.log("Failed to create table with error: '" + err + "'");
	});
    }
}
*/

module.exports = global.db;


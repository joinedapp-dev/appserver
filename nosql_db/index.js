var AWS     = require('../aws');
var DynamoDBModel = require('dynamodb-model');

// schema to hold oauth session info
var sessionSchema = new DynamoDBModel.Schema({
    signInId: {
	type: String,
	key: 'hash'
    },
    signInType: {
	type: String,
	key: 'range'
    },
    authToken: String
});

var sessionTable = new DynamoDBModel.Model(process.env.NOSQL_CLIENT_TABLE_NAME, 
					   sessionSchema, {
					       region: 'us-west-2'
					   });
sessionTable.waitForActiveTable(5000 /* msec */, function (err, response) {
    if (err){
	console.log("Error in creating session table: '" + err);
	throw(err);
    }
    console.log("DynamoDB table is ready: '" + JSON.stringify(response, null, 4));
})

module.exports.sessionSchema = sessionSchema;
module.exports.sessionTable = sessionTable;



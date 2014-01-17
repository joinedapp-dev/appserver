var AWS     = require('../aws');
var DynamoDBModel = require('dynamodb-model');

//var dynamoDb = new AWS.DynamoDB();

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
    oauthToken: String
});

/*
var ss = sessionSchema.mapToDb({
    signInId: 'arash@isl.stanford.edu',
    signInType: 'EMAIL',
    oauthToken: '438v345rotv25b29vb2598yvb58vub98tvb29tbroiguvbet'
});
console.log("============ MAP TO DB: " + JSON.stringify(ss));
*/

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



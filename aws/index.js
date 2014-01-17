var AWS = require('aws-sdk');

AWS.config.region = 'us-west-2'
AWS.config.update({ accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY });

module.exports = AWS;


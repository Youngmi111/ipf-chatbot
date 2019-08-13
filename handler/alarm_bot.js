'use strict';

const S3 = require('aws-sdk').S3;

const AlarmBot = require('../business_logic/alarm_bot');

const response = {
  statusCode: 200,
  body: '',
};

const server = new AlarmBot();

module.exports.listenHandler = (event, context, callback) => {
  server.listen(JSON.parse(event.body), (message) => {
    response.body = JSON.stringify(message);

    callback(null, response);
  });
};

module.exports.eventHandler = (event, context, callback) => {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.cwd() + '/auth.json';

  const sns = JSON.parse(event.Records[0].Sns.Message);

  const done = success => {
    response.body = JSON.stringify({
      success
    });

    callback(null, response);
  };

  if (sns.hasOwnProperty('AlarmDescription')) {
    server.sendAlarmMessage(sns, done);
    
  } else {
    server.sendGreet(done);
  }
};

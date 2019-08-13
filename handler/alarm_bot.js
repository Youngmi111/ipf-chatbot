'use strict';

const Helper = require('../business_logic/helper');
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

module.exports.eventHandler = async (event, context) => {
  let res_body = {};

  try {
    await Helper.setAuth('AWS_ALARM_BOT');

    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/auth.json';

    const sns = JSON.parse(event.Records[0].Sns.Message);

    let success = false;

    if (sns.hasOwnProperty('AlarmDescription')) {
      success = await server.sendAlarmMessage(sns);

    } else {
      success = await server.sendGreet();
    }

    if (success) response.statusCode = 200;
    res_body = {
      success,
    };

  } catch (err) {
    console.log(err.message);
    res_body = {
      'message': err.message,
    }
  }

  response.body = JSON.stringify(res_body);

  return response;
};

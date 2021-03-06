'use strict';

const Helper = require('../business_logic/helper');
const AlarmBot = require('../business_logic/alarm_bot');

const response = {
  statusCode: 200,
  body: '',
};

const server = new AlarmBot();

module.exports.listenHandler = async (event, context) => {
  let res_body = {};

  try {
    await Helper.setAuth('AWS_ALARM_BOT');

    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/auth.json';
    res_body = await server.listen(JSON.parse(event.body));

  } catch (err) {
    res_body = {
      'text': err.message,
    };
  }

  response.body = JSON.stringify(res_body);

  return response;
};

module.exports.eventHandler = async (event, context) => {
  let res_body = {};

  try {
    await Helper.setAuth('AWS_ALARM_BOT');

    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/auth.json';

    let success = false;

    if (event.hasOwnProperty('Records')) {
      success = await server.sendMessage(event.Records[0].Sns);

    } else {
      success = await this.sendGreet();
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

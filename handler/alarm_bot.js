'use strict';

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

  const message = JSON.parse(event.Records[0].Sns.Message);

  const alarm = server.generateMessage(message);

  server.send(alarm, success => {
    response.body = JSON.stringify({
      success
    });

    callback(null, response);
  });
};

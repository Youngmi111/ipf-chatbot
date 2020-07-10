'use strict';

const Helper = require('../business_logic/helper');
const YoungmiBot = require('../business_logic/youngmi_bot');

const response = {
    statusCode: 200,
    body: '',
};

const bot_id = 'iPF_ANNOUNCE_BOT';
const server = new YoungmiBot();

module.exports.listenHandler = async (event, context) => {
    let res_body = {};

    try {
        await Helper.setAuth(bot_id);

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
        await Helper.setAuth(bot_id);

        process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/auth.json';

        let success = false;

        success = await server.sendNotifications();

        if (success) response.statusCode = 200;
        res_body = {
            success,
        };

    } catch (err) {
        res_body = {
            'message': err.message
        };
    }

    response.body = JSON.stringify(res_body);

    return response;
};

module.exports.holiday = async (event, context) => {
    let resBody = {
        'holiday': false,
    };

    try {
        const timestamp = parseInt(event.queryStringParameters.timestamp);
        resBody.holiday = !!Helper.Date.isHoliday(new Date(timestamp));

    } catch (err) {
        console.log(err);
    }

    response.body = JSON.stringify(resBody);

    return response;
};

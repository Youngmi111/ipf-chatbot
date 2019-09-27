'use strict';

const Helper = require('../business_logic/helper');
const HealthBot = require('../business_logic/health_bot');

const response = {
    statusCode: 200,
    body: '',
};

const bot_id = 'iPF_HEALTH_BOT';
const server = new HealthBot();

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

        success = await server.sendRemedy();

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

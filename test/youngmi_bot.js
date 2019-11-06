require('dotenv').config();

const chai = require('chai');
const expect = chai.expect;
const Util = require('../business_logic/util');
const Helper = require('../business_logic/helper');
const YoungmiBot = require('../business_logic/youngmi_bot');

const bot = new YoungmiBot();

describe('date', function() {
    it ('payday is weekday', () => {
        const test = new Date('1 December, 2019').getTime();
        const target_date = bot.getDeadlineForCashDisbursement(test);

        const deadline = Util.convertUTCTimeToLocalTime(target_date);
    });

    it ('payday is weekend', () => {
        const test = new Date('1 November, 2019').getTime();
        const target_date = bot.getDeadlineForCashDisbursement(test);

        const deadline = Util.convertUTCTimeToLocalTime(target_date);
    });

    it ('payday has a year gap', () => {
        const test = new Date('1 January, 2020').getTime();
        const target_date = bot.getDeadlineForCashDisbursement(test);

        const deadline = Util.convertUTCTimeToLocalTime(target_date);
    });
});

describe('message', function() {
    it('correct message', () => {
        const message = bot.generateMessageForCashDisbursement();
        console.log(message);
    })
});

describe('send', function() {
    it('send message', async () => {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = process.cwd() + '/auth.json';

        await bot.sendNotifications();
    });
});
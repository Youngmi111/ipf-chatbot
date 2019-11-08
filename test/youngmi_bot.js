require('dotenv').config();

const chai = require('chai');
const expect = chai.expect;
const Util = require('../business_logic/util');
const Helper = require('../business_logic/helper');
const { YoungmiBot, Payday } = require('../business_logic/youngmi_bot');

const bot = new YoungmiBot();

describe('working day', function() {
    it('get the first working date', () => {
        const first_day = YoungmiBot.getTheFirstWorkingDayOfMonth(new Date('10 November, 2019').getTime());
        const correct = Util.convertUTCTimeToLocalTime(new Date(first_day).toISOString()).startsWith('11/1/2019');

        expect(correct).to.be.true;
    });

    it('is the first working day', () => {
        const first_day = new Date('2 December, 2019');

        expect(bot.isTheFirstWorkingDayOfMonth(first_day)).to.be.true;
    });

    it('is not the first working day', () => {
        const first_day = new Date('1 December, 2019');

        expect(bot.isTheFirstWorkingDayOfMonth(first_day)).to.be.false;
    });
});

describe('payday', function() {
    it ('deadline (payday is weekday)', () => {
        const now = new Date('1 December, 2019').getTime();
        const deadline = Payday.getDeadlineForCashDisbursement(now);

        // correct deadline 2019/12/3
        expect(new Date(deadline).getDate()).to.be.equal(3);
    });

    it ('deadline (payday is not working day)', () => {
        const now = new Date('1 November, 2019').getTime();
        const deadline = Payday.getDeadlineForCashDisbursement(now);

        // correct deadline 2019/11/1
        expect(new Date(deadline).getDate()).to.be.equal(1);
    });

    it ('payday (payday is weekday)', () => {
        const now = new Date('1 January, 2020');
        const payday = Payday.getPayday(now);

        // correct payday 2020/1/10
        expect(new Date(payday).getDate()).to.be.equal(10);
    });

    it('payday (payday is not working day', () => {
        const now = new Date('2 November, 2019');
        const payday = Payday.getPayday(now);

        // correct payday 2010/11/8
        expect(new Date(payday).getDate()).to.be.equal(8);
    });
});

describe('message', function() {
    it('correct message', () => {
        const message = Payday.generateMessageForCashDisbursement();
        console.log(message);
    })
});

/*/
describe('send', function() {
    it('send message', async () => {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = process.cwd() + '/auth.json';

        await bot.sendNotifications();
    });
});
/**/
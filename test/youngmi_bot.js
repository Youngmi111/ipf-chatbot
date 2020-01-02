require('dotenv').config();

const chai = require('chai');
const expect = chai.expect;
const Util = require('../business_logic/util');
const Helper = require('../business_logic/helper');
const YoungmiBot = require('../business_logic/youngmi_bot');
const OfficeEvent = require('../business_logic/office_event');
const OfficialDocument = require('../business_logic/official_document');

const bot = new YoungmiBot();

describe('working day', function() {
    it('get the first working date', () => {
        const first_day = Helper.Date.getTheFirstWorkingDayOfMonth(new Date('10 November, 2019').getTime());
        const correct = Util.convertUTCTimeToLocalTime(new Date(first_day).toISOString()).startsWith('11/1/2019');

        expect(correct).to.be.true;
    });

    it('is the first working day', () => {
        const first_day = new Date('2 December, 2019');

        expect(Helper.Date.isTheFirstWorkingDayOfMonth(first_day)).to.be.true;
    });

    it('is not the first working day', () => {
        const first_day = new Date('1 December, 2019');

        expect(Helper.Date.isTheFirstWorkingDayOfMonth(first_day)).to.be.false;
    });
});

describe('payday', function() {
    it ('deadline (payday is weekday)', () => {
        const now = new Date('1 December, 2019').getTime();
        const deadline = OfficeEvent.getDeadlineForCashDisbursement(now);

        // correct deadline 2019/12/3
        expect(new Date(deadline).getDate()).to.be.equal(3);
    });

    it ('deadline (payday is not working day)', () => {
        const now = new Date('1 November, 2019').getTime();
        const deadline = OfficeEvent.getDeadlineForCashDisbursement(now);

        // correct deadline 2019/11/1
        expect(new Date(deadline).getDate()).to.be.equal(1);
    });

    it ('payday (payday is weekday)', () => {
        const now = new Date('11 December, 2019');
        const payday = OfficeEvent.getPayday(now);

        // correct payday 2020/2/10
        expect(new Date(payday).getDate()).to.be.equal(10);
    });

    it('payday (payday is not working day', () => {
        const now = new Date('2 November, 2019');
        const payday = OfficeEvent.getPayday(now);

        // correct payday 2010/11/8
        expect(new Date(payday).getDate()).to.be.equal(8);
    });
});

describe('message', function() {
    it('message for cash disbursement notice', () => {
        const message = OfficeEvent.generateMessageForCashDisbursement();
        console.log(message);
    });

    it('message for cash disbursement question', () => {
        const now = new Date('3 January, 2020');
        const message = OfficeEvent.generateMessageForCashDisbursementAnswer(now);
        console.log(message);
    });

    it('message for payday', () => {
        const now = new Date('11 January, 2020');
        const message = OfficeEvent.generateMessageForPayday(now);
        console.log(message);
    });

    it('message for documents', () => {
        const request = '사무용품 신청';
        const message = OfficialDocument.generateMessageForDocumentLink(request);
    });
});

/*/
describe('send', function() {
    it('send message', async () => {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = process.cwd() + '/auth.json';

        await bot.sendNotifications();
    });
});
/**/

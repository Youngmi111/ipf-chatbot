require('dotenv').config();

const chai = require('chai');
const expect = chai.expect;
const Util = require('../business_logic/util');
const Helper = require('../business_logic/helper');
const YoungmiBot = require('../business_logic/youngmi_bot');
const Payday = require('../business_logic/payday');
const CashDisbursement = require('../business_logic/cash_disbursement');
const OfficeEvent = require('../business_logic/office_event');
const OfficialDocument = require('../business_logic/official_document');

const bot = new YoungmiBot();

describe('working day', function() {
    it('get the first working date', () => {
        const first_day = Helper.Date.getTimeAsMilliSecondsForTheFirstWorkingDayOfMonth(new Date('10 November, 2019').getTime());
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
    it ('payday (payday is weekday)', () => {
        const now = new Date('11 December, 2019');
        const payday = Payday.get(now);

        console.log('correct payday 2020/1/10', Util.convertUTCTimeToLocalTime(payday))
        expect(Util.convertUTCTimeToLocalTime(payday)).to.startsWith('1/10/2020');
    });

    it('payday (payday is not working day', () => {
        const now = new Date('1 Oct, 2020');
        const payday = Payday.get(now);

        console.log('correct payday 2020/10/08', Util.convertUTCTimeToLocalTime(payday))
        expect(Util.convertUTCTimeToLocalTime(payday)).to.startsWith('10/8/2020');
    });

    it('message for payday', () => {
        const handler = new Payday(new Date('11 January, 2020'));
        const message = handler.answer();

        console.log({message});
    });
});

describe('cash disbursement', function() {
    // const handler = new CashDisbursement(new Date('3 January, 2020'));
    const handler = new CashDisbursement();

    it ('deadline (payday is weekday)', () => {
        const now = new Date('1 December, 2019');
        const deadline = CashDisbursement.get(now.getTime());

        console.log('correct deadline 2019/12/3', Util.convertUTCTimeToLocalTime(deadline));
        expect(Util.convertUTCTimeToLocalTime(deadline)).to.startsWith('');
    });

    it ('deadline (payday is not working day)', () => {
        const now = new Date('1 November, 2019').getTime();
        const deadline = CashDisbursement.get(now);

        console.log('correct deadline 2019/11/1', Util.convertUTCTimeToLocalTime(deadline));
        expect(Util.convertUTCTimeToLocalTime(deadline)).to.startsWith('11/1/2019');
    });

    it('message for cash disbursement notice', () => {
        const message = handler.messageForThe1stBusinessDayOfMonth;
        console.log(message);
    });

    it('message for cash disbursement question', () => {
        const message = handler.answer();
        console.log(message);
    });
});

/*/
describe('message', function() {
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

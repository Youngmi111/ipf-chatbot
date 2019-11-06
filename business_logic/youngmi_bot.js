const Helper = require('./helper');
const ChatbotServer = require('./chatbot_server');

module.exports = class extends ChatbotServer {
    constructor() {
        super('iPF_ANNOUNCE_BOT');
    }

    getAvailableDate(date) {
        while (!Helper.Date.isWorkingDay(date)) {
            date -= 60 * 60 * 24 * 1000;
        }

        return date;
    }

    getPayday(now) {
        const datetime = new Date(now.getFullYear(), now.getMonth(), 10).getTime();
        return this.getAvailableDate(datetime);
    }

    getWorkingDay(since, days_before) {
        while (days_before > 0) {
            since -= 60 * 60 * 24 * 1000;

            if (since === this.getAvailableDate(since)) days_before--;
        }

        return since;
    }

    getDeadlineForCashDisbursement(time = Date.now()) {
        const now = new Date(time);

        const payday = this.getPayday(now);
        return this.getWorkingDay(payday, 5);
    }

    isEndDateForCashDisbursement() {
        const one_day = (60 * 60 * 24 * 1000);
        const seven_days = one_day * 7;

        const deadline = this.getDeadlineForCashDisbursement();

        const date_str = [deadline - one_day, deadline - seven_days].map(time => {
            return new Date(time).toDateString();
        });

        return date_str.includes(new Date().toDateString());
    }

    findEvents(forced) {
        let event = [];

        if (forced === true) event.push('CASH_DISBURSEMENT');

        if (this.isEndDateForCashDisbursement()) {
            event.push('CASH_DISBURSEMENT');
        }

        return event;
    }

    generateMessageForCashDisbursement() {
        const deadline_date = new Date(this.getDeadlineForCashDisbursement());
        const last_month = new Date(deadline_date.getFullYear(), deadline_date.getMonth(), 0);

        const readable_deadline = `${ (deadline_date.getMonth() + 1) }/${ deadline_date.getDate() }(${ Helper.Date.DAY[deadline_date.getDay()] })`;

        return `
*${ last_month.getFullYear() }년 ${ (last_month.getMonth() + 1) }월분 지출결의서 제출하실 분들은 ${ readable_deadline }까지 ymcho에게 제출해 주시기 바랍니다.*

* 제출일정 : ${ readable_deadline }  
* 그룹리더 서명 받고 제출하기
1) 기존 지출결의서 양식이 아닌 변경된 양식(링크)을 작성/출력하여
2) 본인 서명
3) 소속 그룹 리더의 확인 및 서명을 받고 제출 바랍니다.

${ process.env.CASH_DISBURSEMENT_URL }`;
    }

    generateMessage(event) {
        let message = '';

        switch (event) {
            case 'CASH_DISBURSEMENT':
                message = this.generateMessageForCashDisbursement();
                break;

            default:
        }

        return {
            'text': message
        };
    }

    sendNotifications(forced) {
        return new Promise((resolve, reject) => {
            let tasks = [];

            this.findEvents(forced).forEach(event => {
                const message = this.generateMessage(event);
                tasks.push(this.send(message));
            });

            Promise.all(tasks).then(results => {
                resolve(results);

            }).catch(err => {
                reject(err);

            });
        });
    }
};

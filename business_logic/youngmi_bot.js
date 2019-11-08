const Helper = require('./helper');
const ChatbotServer = require('./chatbot_server');

class YoungmiBot extends ChatbotServer {
    constructor() {
        super('iPF_ANNOUNCE_BOT');
    }

    static getAvailableDate(datetime, find_in_past = true) {
        let one_day = 60 * 60 * 24 * 1000;
        if (find_in_past) one_day *= -1;

        while (!Helper.Date.isWorkingDay(datetime)) {
            datetime += one_day;
        }

        return datetime;
    }

    static getWorkingDay(since, days_before) {
        while (days_before > 0) {
            since -= 60 * 60 * 24 * 1000;

            if (since === YoungmiBot.getAvailableDate(since)) days_before--;
        }

        return since;
    }

    static getTheFirstWorkingDayOfMonth(datetime = Date.now()) {
        const now = new Date(datetime);

        const first_day = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        return this.getAvailableDate(first_day, false);
    }

    isTheFirstWorkingDayOfMonth(now = new Date()) {
        return now.getDate() === new Date(YoungmiBot.getTheFirstWorkingDayOfMonth(now.getTime())).getDate();
    };

    findEvents(forced) {
        let event = [];

        if (forced === true) event.push('CASH_DISBURSEMENT');

        if (this.isTheFirstWorkingDayOfMonth()) {
            event.push('CASH_DISBURSEMENT');

        } else if (Payday.isDeadlineForTheCashDisbursement()) {
            event.push('IS_DEADLINE_FOR_CASH_DISBURSEMENT');
        }

        return event;
    }

    generateMessage(event) {
        let message = '';

        switch (event) {
            case 'CASH_DISBURSEMENT':
                message = Payday.generateMessageForCashDisbursement();
                break;

            case 'IS_DEADLINE_FOR_CASH_DISBURSEMENT':
                message = Payday.generateMessageForCashDisbursementDeadline();
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

    containsSalaryQuestion(message) {
        return /(월급|월급날|급여일)/.test(message) && /(며칠|몇일|몇 일|언제|얼마나|ㅇㅈ)/.test(message);
    }

    needToAnnounce(message) {
        return /^(\[인턴 일해라\])/.test(message);
    }

    sendManualAnnouncement(message) {
        message = {
            'text': message.replace('[인턴 일해라]', '').trim()
        };

        return new Promise(resolve => {
            this.send(message).then(results => {
                resolve(true);

            }).catch(err => {
                resolve(false);
            });
        });
    }

    async respondToUsersMessage(req_body) {
        try {
            await this.receiver.add(req_body.space.name, req_body.user.displayName);

            let response = this.MESSAGE.MESSAGE;
            const user_message = req_body.message.text;

            const for_announce = this.needToAnnounce(user_message);

            if (for_announce) {
                const result = await this.sendManualAnnouncement(user_message);

                response = result ? '공지를 전달했습니다!' : '제가... 뭔가.... 실수를 한 것 같아요. 다시 한 번 메시지 주시겠어요?';

            } else if (this.containsSalaryQuestion(user_message)) {
                response = Payday.generateMessageForPayday();
            }

            if (for_announce === false) console.log(`[USER_MESSAGE][${ req_body.user.displayName }] ${ user_message }`);

            return {
                'text': response,
            };

        } catch (err) {
            return {
                'text': this.MESSAGE['MESSAGE--FAILED'],
            };
        }
    }
}

const Payday = {
    getPayday(now) {
        const datetime = new Date(now.getFullYear(), now.getMonth(), 10).getTime();
        return YoungmiBot.getAvailableDate(datetime);
    },

    getDeadlineForCashDisbursement(datetime = Date.now()) {
        const payday = this.getPayday(new Date(datetime));
        return YoungmiBot.getWorkingDay(payday, 5);
    },

    isDeadlineForTheCashDisbursement() {
        const now = new Date();
        return now.getDate() === new Date(this.getDeadlineForCashDisbursement()).getDate();
    },

    generateMessageForCashDisbursement() {
        const deadline_date = new Date(this.getDeadlineForCashDisbursement());
        const last_month = new Date(deadline_date.getFullYear(), deadline_date.getMonth(), 0);

        const readable_deadline = `${ (deadline_date.getMonth() + 1) }/${ deadline_date.getDate() }(${ Helper.Date.DAY[deadline_date.getDay()] })`;

        return `*${ last_month.getFullYear() }년 ${ (last_month.getMonth() + 1) }월분 지출결의서 제출하실 분들은 ${ readable_deadline }까지 ymcho에게 제출해 주시기 바랍니다.*

* 제출일정 : ${ readable_deadline }  
* 그룹리더 서명 받고 제출하기
1) 기존 지출결의서 양식이 아닌 변경된 양식(링크)을 작성/출력하여
2) 본인 서명
3) 소속 그룹 리더의 확인 및 서명을 받고 제출 바랍니다.

${ process.env.CASH_DISBURSEMENT_URL }`;
    },

    generateMessageForCashDisbursementDeadline(now = new Date()) {
        const last_month = new Date(now.getFullYear(), now.getMonth(), 0);

        return `오늘은 *${ last_month.getFullYear() }년 ${ (last_month.getMonth() + 1) }월분 지출결의서 제출 마감일입니다.`;
    },

    generateMessageForPayday(now = new Date()) {
        let payday_datetime = this.getPayday(now);

        if (new Date(payday_datetime).getDate() < now.getDate()) {
            const next_month = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            payday_datetime = this.getPayday(next_month);
        }

        let payday = new Date(payday_datetime);
        const readable_payday = `${ payday.getFullYear() }년 ${ (payday.getMonth() + 1) }월 ${ payday.getDate() }일 ${ Helper.Date.DAY[payday.getDay()]}요일`;

        let message = '';

        const one_day = 60 * 60 * 24 * 1000;
        payday = new Date(payday_datetime + one_day - 1000); // 23시 59분 59초까지 월급날

        if (payday.getTime() - now.getTime() < one_day) {
            const party = String.fromCodePoint(0x1F973);
            message = `바로 오늘!!! 소리질뤄!!!!!!!!! ${ party }`;

        } else {
            const remain_days = Math.floor((payday.getTime() - now.getTime()) / one_day);

            message = `다음 월급날은 ${ readable_payday }입니다.
월급날까지 ${ remain_days }일 남았습니다! 힘을 내세여!!!!`;
        }

        return message;
    }
};

const Announcement = {
};

module.exports.YoungmiBot = YoungmiBot;

module.exports.Payday = Payday;

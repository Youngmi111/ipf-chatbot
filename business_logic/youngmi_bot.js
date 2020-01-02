const Helper = require('./helper');
const ChatbotServer = require('./chatbot_server');
const OfficeEvent = require('./office_event');

class YoungmiBot extends ChatbotServer {
    constructor() {
        super('iPF_ANNOUNCE_BOT');
    }

    findEvents(forced) {
        let event = [];

        if (forced === true) event.push('CASH_DISBURSEMENT');

        if (this.isTheFirstWorkingDayOfMonth()) {
            event.push('CASH_DISBURSEMENT');

        } else if (OfficeEvent.isDeadlineForTheCashDisbursement()) {
            event.push('IS_DEADLINE_FOR_CASH_DISBURSEMENT');
        }

        return event;
    }

    generateMessage(event) {
        let message = '';

        switch (event) {
            case 'CASH_DISBURSEMENT':
                message = OfficeEvent.generateMessageForCashDisbursement();
                break;

            case 'IS_DEADLINE_FOR_CASH_DISBURSEMENT':
                message = OfficeEvent.generateMessageForCashDisbursementDeadline();
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

    containsCashDisbursementQuestion(message) {
        return /(지출 결의|지출결의|지결)/.test(message) && /(며칠|몇일|몇 일|언제)/.test(message);
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
                response = OfficeEvent.generateMessageForPayday();

            } else if (this.containsCashDisbursementQuestion(user_message)) {
                response = OfficeEvent.generateMessageForCashDisbursementAnswer();

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



const Announcement = {
};

module.exports = YoungmiBot;

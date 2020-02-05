const ChatbotServer = require('./chatbot_server');
const Helper = require('./helper');
const OfficeEvent = require('./office_event');
const OfficialDocument = require('./official_document');
const Official101Doc = require('./official_guide');

class YoungmiBot extends ChatbotServer {
    constructor() {
        super('iPF_ANNOUNCE_BOT');
    }

    findEvents(forced) {
        let event = [];

        if (forced === true) event.push('CASH_DISBURSEMENT');

        if (Helper.Date.isTheFirstWorkingDayOfMonth()) {
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

    containsDocumentRequest(message) {
        return /(휴가|연차|역량 개발비|자기 개발|자기 계발|자기개발|자기계발|구매|구입|비품|사무용품)/.test(message) && /(신청|신청서|양식|문서|링크|주소)/.test(message);
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

            } else if (this.containsDocumentRequest(user_message)) {
                response = OfficialDocument.generateMessageForDocumentLink(user_message);

            } else {
                const docs = await Official101Doc.findContents(user_message);

                if (docs.length > 0) {
                    const message = await Official101Doc.generateMessage(docs);
                    return message;
                }
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

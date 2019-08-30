const axios = require('axios');

const Util = require('./util');
const ChatbotServer = require('./chatbot_server');
const AlarmHistory = require('./alarm_history');

module.exports = class extends ChatbotServer {
    constructor() {
        super('AWS_ALARM_BOT');

        this.history = null;
    }

    async greet() {
        const cross_finger = String.fromCodePoint(0x1F91E);
        
        let gif = '';
        
        try {
            const response = await axios.get('http://api.giphy.com/v1/gifs/random?api_key=6ouMjDk5Pu1qJjj7l6GMxbUiM5mvIHQZ&tag=pray');
            const image_data = response.data.data;
            gif = image_data.image_url;
        
        } catch (err) {
            gif = 'https://ipf-chatbot.s3.ap-northeast-2.amazonaws.com/pray.gif';
        }

        return {
            'cards': [{
                'header': {
                    'title': `${ cross_finger } 평화로운 한 주가 되기를 기원합니다. ${ cross_finger }`,
                },
                'sections': [{
                    'widgets': [{
                        'image': {
                            'imageUrl': gif,
                        },
                    }]  
                }],
            }],
        };
    }

    generatePayloadForAlarmMessage(title, time, summary, details) {
        const scream = String.fromCodePoint(0x1F514);
        const think = String.fromCodePoint(0x1F914);

        return {
            'cards': [{
                'header': {
                    'title': `${ scream } ${ title } 알람이 발생했습니다.`,
                },
                'sections': [{
                    'widgets': [{
                        'keyValue': {
                            'topLabel': 'Time',
                            'content': time,
                        },
                    }, {
                        'keyValue': {
                            'topLabel': 'Summary',
                            'content': summary,
                            'contentMultiline': true,
                        },
                    }, {
                        'keyValue': {
                            'topLabel': 'Details',
                            'content': details,
                            'contentMultiline': true,
                        }
                    }],
                }, {
                    'widgets': [{
                        'buttons': [{
                            'textButton': {
                                'text': `${ think } 이 알람 내용을 파악중입니다.`,
                                'onClick': {
                                    'action': {
                                        'actionMethodName': 'alarm_snooze',
                                        'parameters': [{
                                            'key': 'alarm_name',
                                            'value': title,
                                        }],
                                    },
                                },
                            },
                        }],
                    }],
                }],
            }],
        }
    }

    getFormattedMessage(message, subject, timestamp) {
        const trigger_from = message.Trigger.Namespace;

        const title = message.AlarmName;
        const summary = message.AlarmDescription;
        let time = '';
        let details = '';

        if (trigger_from.includes('/UserJourney')) {
            if (!subject.includes('FAILURE')) return false;

            time = Util.convertUTCTimeToLocalTime(timestamp);
            details = message.NewStateReason.map(link => {
                return '* ' + link;
            }).join("\n");

        } else {
            const unit = message.Trigger.hasOwnProperty('Unit') && message.Trigger.Unit ? message.Trigger.Unit : '';

            time = Util.convertUTCTimeToLocalTime(message.StateChangeTime);
            details = [
                `* ${ message.Trigger.MetricName } ${ unit } ${ message.Trigger.Statistic } 모니터링을 통해 발생한 알람입니다.`,
                `* ${ message.NewStateReason }`,
            ].join("\n");
        }

        return this.generatePayloadForAlarmMessage(title, time, summary, details);
    }

    async getHistory(alarm_name) {
        this.history = new AlarmHistory(alarm_name);
        const alarm = await this.history.find();

        return alarm.hasOwnProperty('Item') ? alarm.Item : false;
    }

    isMutedAlarm(alarm) {
        return new Date(alarm.mute_until.S).valueOf() > Date.now();
    }

    async sendMessage(sns) {
        const subject = sns.Subject;
        const timestamp = sns.Timestamp;
        const message = JSON.parse(sns.Message);

        let success = false;

        if (message.hasOwnProperty('AlarmDescription')) {
            const alarm = await this.getHistory(message.AlarmName);

            if (alarm !== false && this.isMutedAlarm(alarm)) return true;

            const formatted_message = this.getFormattedMessage(message, subject, timestamp);

            if (formatted_message === false) return true;

            this.history.update({
                'mute_until': {
                    'S': new Date().toISOString(),
                },
            });

            success = await this.sendAlarmMessage(formatted_message);

        } else {
            success = await this.sendGreet();
        }

        return success;
    }

    sendAlarmMessage(message) {
        return new Promise((resolve, reject) => {
            this.send(message).then(success => {
                resolve(success);
            }).catch(err => {
                reject(err);
            });
        });
    }

    sendGreet() {
        return new Promise((resolve, reject) => {
            this.greet().then(message => {
                this.send(message).then(success => {
                    resolve(success);
                }).catch(err => {
                    reject(err);
                });

            }).catch(err => {
                reject(err);
            })
        });
    }

    async snooze(req_body) {
        const alarm_name = req_body.action.parameters.find(param => {
            return param.key == 'alarm_name';
        }).value;

        const pray = String.fromCodePoint(0x1F64F);
        let final_message = `${ pray } ${ pray } ${ pray }`;

        try {
            const alarm = await this.getHistory(alarm_name);

            const hands_up = String.fromCodePoint(0x1F64B);
            const user = alarm.hasOwnProperty('mute_by') ? alarm.mute_by.S : req_body.user.displayName;

            let text = `${ hands_up } ${ user }님이 ${ alarm_name } 알람을 파악중입니다. `;

            if (!this.isMutedAlarm(alarm)) {
                this.history.update({
                    'mute_until': {
                        'S': new Date(Date.now() + (60 * 30 * 1000)).toISOString(),
                    },
                    'mute_by': {
                        'S': user,
                    },
                });

                text += `앞으로 30분 간 같은 알람이 발생하더라도 메시지를 전달하지 않습니다.`;
                await this.sendAlarmMessage({
                    text,
                });

            } else {
                if (user != req_body.user.displayName) final_message = `${hands_up} ${ req_body.user.displayName } 힘을 보탭니다!`;
            }

        } catch (err) {}

        return {
            'actionResponse': {
                'type': 'NEW_MESSAGE',
            },
            'text': final_message,
        };
    }

    async respondToCardClicked(req_body) {
        switch (req_body.action.actionMethodName) {
            case 'alarm_snooze':
                return await this.snooze(req_body);

            default:
                break;
        }
    }
};

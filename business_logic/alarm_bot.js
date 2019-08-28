const axios = require('axios');

const ChatBotServer = require('./chatbot_server');

module.exports = class extends ChatBotServer {
    constructor() {
        super('AWS_ALARM_BOT');
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

    getAlarmOccurringDatetime(timestamp) {
        return new Date(timestamp).toLocaleString('ko-KR', {'timeZone': 'Asia/Seoul'})
    }

    generateMessageForUserJourney(message, datetime) {
        const links = message.NewStateReason.map(link => {
            return '* ' + link;
        }).join("\n");

        return `*${ message.AlarmName } 알람이 발생했습니다.*
        
[Time]
${ this.getAlarmOccurringDatetime(datetime) }

[Summary]
${ message.AlarmDescription }

[Details]
${ links }`;
    }

    generateMessage(message_obj) {
        const unit = message_obj.Trigger.Unit ? message_obj.Trigger.Unit : '';
        
        return `*${ message_obj.AlarmName } 알람이 발생했습니다.*

[Time]
${ this.getAlarmOccurringDatetime(message_obj.StateChangeTime) }

[Summary]
${ message_obj.AlarmDescription }

[Details]
* ${ message_obj.Trigger.MetricName } ${ unit } ${ message_obj.Trigger.Statistic } 모니터링을 통해 발생한 알람입니다.
* ${ message_obj.NewStateReason }`;
    }

    getFormattedMessage(message, subject, timestamp) {
        const trigger_from = message.Trigger.Namespace;

        if (trigger_from.includes('/UserJourney')) {
            if (subject.includes('FAILED')) {
                return this.generateMessageForUserJourney(message, timestamp);
            }

            return false;
        }

        return this.generateMessage(message);
    }

    async sendMessage(sns) {
        const subject = sns.Subject;
        const timestamp = sns.Timestamp;
        const message = JSON.parse(sns.Message);

        let success = false;

        if (message.hasOwnProperty('AlarmDescription')) {
            const formatted_message = this.getFormattedMessage(message, subject, timestamp);

            if (formatted_message !== false) {
                success = await this.sendAlarmMessage(formatted_message);
            } else {
                success = true;
            }

        } else {
            success = await this.sendGreet();
        }

        return success;
    }

    sendAlarmMessage(text) {
        return new Promise((resolve, reject) => {
            const message = {
                text,
            };

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
};

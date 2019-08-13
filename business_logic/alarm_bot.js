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

    generateMessage(message_obj) {
        const from_eb = message_obj.Trigger.Namespace == 'AWS/ElasticBeanstalk';
        const from = from_eb ? message_obj.Trigger.Dimensions[0].name : message_obj.AlarmName;

        const unit = message_obj.Trigger.Unit ? message_obj.Trigger.Unit : '';
        
        const timestamp = new Date(message_obj.StateChangeTime);
        const occurring_at = timestamp.toLocaleString('ko-KR', {
        'timeZone': 'Asia/Seoul',
        });

        return `*${ from }${ from_eb ? '에서' : ''} 알람이 발생했습니다.*

[Time]
${ occurring_at }

[Summary]
${ message_obj.AlarmDescription }

[Details]
* ${ message_obj.Trigger.MetricName } ${ unit } ${ message_obj.Trigger.Statistic } 모니터링을 통해 발생한 알람입니다.
* ${ message_obj.NewStateReason }`;
    }

    sendAlarmMessage(sns, callback) {
        const message = {
            'text': this.generateMessage(sns),
        };

        this.send(message, callback);
    }

    sendGreet(callback) {
        this.greet().then(message => {
            this.send(message, callback);

        }).catch(err => {
            callback(false);
        })
    }
};

const ChatBotServer = require('./chatbot_server');

module.exports = class extends ChatBotServer {
    constructor() {
        super('AWS_ALARM_BOT');
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

[Details]
* ${ message_obj.Trigger.MetricName } ${ unit } ${ message_obj.Trigger.Statistic } 모니터링을 통해 발생한 알람입니다.
* ${ message_obj.NewStateReason }`;
    }
};

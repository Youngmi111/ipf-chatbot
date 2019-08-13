const chai = require('chai');
const expect = chai.expect;
const AlarmBot = require('../business_logic/alarm_bot');

process.env.AWS_REGION = 'ap-northeast-2';
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.cwd() + '/auth.json';

describe('AWS Alarm Bot', function() {
    const bot = new AlarmBot();

    const params = {
        'type': 'ADDED_TO_SPACE',
        'space': {
            'name': 'spaces/AAAAAAAAAAA',
        },
        'user': {
            'displayName': 'Kyungai Lee',
        },
        'message': {
        } 
    };

    /*/
    it('Add bot as a friend', async () => {
        await bot.listen(params, (message) => {
            console.log(message);
            expect(message.text).is.equal(bot.MESSAGE[params.type]);
        });

        const space_ids = await bot.receiver.get();
        const register = space_ids.find(space_id => {
            return space_id == params.space.name;
        });
        expect(register).is.not.false;
    });
    /**/

    it('Send greeting', async () => {
        bot.sendGreet(success => {
            console.log(success);
        });
    });


    /*/
    it('Alarm occurs', async () => {
        const message = {
            "AlarmName": "TEST ALARM MESSAGE",
            "AlarmDescription": "테스트 알람 메시지 입니다. 이 메시지는 무시하셔도 좋습니다.",
            "AWSAccountId": "xxxxxx",
            "NewStateValue": "ALARM",
            "NewStateReason": "Threshold Crossed: 1 out of the last 1 datapoints [15.0 (22/05/18 20:37:00)] was greater than or equal to the threshold (5.0) (minimum 1 datapoint for OK -> ALARM transition).",
            "StateChangeTime": "2018-05-22T20:38:49.939+0000",
            "Region": "US East (N. Virginia)",
            "OldStateValue": "OK",
            "Trigger": {
                "MetricName": "TEST",
                "Namespace": "TEST",
                "StatisticType": "Statistic",
                "Statistic": "AVERAGE",
                "Unit": null,
                "Dimensions": [{
                    "name": "EnvironmentName",
                    "value": "ereg3-lov-np-test"
                }],
                "Period": 60,
                "EvaluationPeriods": 1,
                "ComparisonOperator": "GreaterThanOrEqualToThreshold",
                "Threshold": 5.0,
                "TreatMissingData": "",
                "EvaluateLowSampleCountPercentile": ""
            }
        }

        bot.sendAlarmMessage(message, (success) => {
            console.log(success);
        });
    });
    /**/
});
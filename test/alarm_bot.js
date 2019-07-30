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
    /** */

    it('Alarm occurs', async () => {
        await bot.send('This is the test message!', (success) => {
            console.log(success);
        });
    });
    /**/
});
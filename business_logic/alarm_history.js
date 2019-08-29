const Helper = require('./helper');

module.exports = class {
    constructor(alarm_name) {
        this.bot_id = 'AWS_ALARM_BOT_HISTORY';
        this.space_id = alarm_name;
    }

    async find() {
        const params = {
            'TableName': process.env.DYNAMODB_TABLE_NAME,
            'Key': {
                'bot_id': {
                    'S': this.bot_id,
                },
                'space_id': {
                    'S': this.space_id,
                },
            },
        };

        try {
            return await Helper.DynamoDB.get(params);

        } catch (err) {
            console.error(err);
            return false;
        }
    }

    async update(params) {
        const options = {
            'TableName': process.env.DYNAMODB_TABLE_NAME,
            'Item': {
                'bot_id': {
                    'S': this.bot_id,
                },
                'space_id': {
                    'S': this.space_id,
                },
            }
        };

        options.Item = Object.assign(options.Item, params);

        try {
            return await Helper.DynamoDB.add(options);

        } catch (err) {
            console.error(err);
            return false;
        }
    }
};

const AWS = require('aws-sdk');

const { google } = require('googleapis');

class ChatbotReceiver {
    constructor(bot_id) {
        this.bot_id = bot_id;

        this.client = new AWS.DynamoDB({
            region: process.env.AWS_REGION
        });
    }

    get() {
        const params = {
            'TableName': process.env.DYNAMODB_TABLE_NAME,
            'KeyConditionExpression': 'bot_id = :id',
            'ExpressionAttributeValues': {
                ':id': {
                    'S': this.bot_id,
                },
            },
        };

        return new Promise((resolve, reject) => {
            this.client.query(params, (err, data) => {
                if (err) {
                    reject(err);

                } else {
                    const items = data.Items;

                    let space_ids = [];
                    for (const item of items) {
                        space_ids.push(item.space_id.S.trim());
                    }

                    resolve(space_ids);
                }
            });
        });
    }

    add(space_id, user_name) {
        const params = {
            'TableName': process.env.DYNAMODB_TABLE_NAME,
            'Item': {
                'bot_id': {
                    'S': this.bot_id,
                },
                'space_id': {
                    'S': space_id,
                },
                'user_name': {
                    'S': user_name,
                },
            }
        };

        return new Promise((resolve, reject) => {
            this.client.putItem(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    delete(space_id) {
        const params = {
            'TableName': process.env.DYNAMODB_TABLE_NAME,
            'Key': {
                'bot_id': {
                    'S': this.bot_id,
                },
                'space_id': {
                    'S': space_id,
                },
            }
        };

        return new Promise((resolve, reject) => {
            this.client.deleteItem(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
}

module.exports = class {
    constructor(id) {
        this._id = id;
        this.receiver = new ChatbotReceiver(id);
    }

    get MESSAGE() {
        const REGISTER_FAILED = '친구 등록에 실패했는데 다시 한 번 메시지 주시겠어여?';

        return {
            'ADDED_TO_SPACE': '안녕하세여!',
            'ADDED_TO_SPACE--FAILED': '안녕하세여! ' . REGISTER_FAILED,
            'MESSAGE': '(뭐라고 하는지 모르겠다. 그냥 가만히 있어야 겠다.)',
            'MESSAGE--FAILED': REGISTER_FAILED,
        };
    }

    async respondToUsersMessage(req_body) {
        try {
            await this.receiver.add(req_body.space.name, req_body.user.displayName);
            return {
                'text': this.MESSAGE.MESSAGE,
            };

        } catch (err) {
            return {
                'text': this.MESSAGE['MESSAGE--FAILED'],
            };
        }
    }

    async respondToCardClicked(req_body) {
    }

    async listen(req_body) {
        switch(req_body.type) {
            case 'ADDED_TO_SPACE':
                try {
                    await this.receiver.add(req_body.space.name, req_body.user.displayName);
                    return {
                        'text': this.MESSAGE.ADDED_TO_SPACE
                    };

                } catch (err) {
                    return {
                        'text': this.MESSAGE['ADDED_TO_SPACE--FAILED']
                    };
                }

            case 'REMOVED_FROM_SPACE':
                try {
                    await this.receiver.delete(req_body.space.name);

                } catch (err) {}
                return {};

            case 'MESSAGE':
                return await this.respondToUsersMessage(req_body);

            case 'CARD_CLICKED':
                return await this.respondToCardClicked(req_body);
        }
    }

    generateMessage(message_obj) {
    }

    send(req_body) {
        return new Promise((resolve, reject) => {
            this.receiver.get().then(async (space_ids) => {
                const auth = await google.auth.getClient({
                    scopes: ['https://www.googleapis.com/auth/chat.bot']
                });

                const chat = google.chat('v1');

                let tasks = [];

                for (const space_id of space_ids) {
                    tasks.push(chat.spaces.messages.create({
                        auth,
                        'parent': space_id,
                        'requestBody': req_body,
                    }));
                }

                Promise.all(tasks).then(data => {
                    resolve(true);

                }).catch(err => {
                    console.error(err);
                    reject(err);
                });

            }).catch(err => {
                console.error(err);
                reject(err);
            });
        });
    }
};

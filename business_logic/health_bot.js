const axios = require('axios');
const AWS = require('aws-sdk');

const Util = require('./util');
const ChatbotServer = require('./chatbot_server');

module.exports = class extends ChatbotServer {
    constructor() {
        super('iPF_HEALTH_BOT');
    }

    get MESSAGE() {
        const REGISTER_FAILED = '친구 등록에 실패했는데 다시 한 번 메시지 주시겠어여?';

        const add = '안녕하세여! iPF 멤버들의 "아프지 말고 행복한 삶"을 위해 평일 오전 9시부터 오후 6시까지, 매시 55분마다 스트레칭 알람을 보내드립니다.';

        return {
            'ADDED_TO_SPACE': add,
            'ADDED_TO_SPACE--FAILED': '안녕하세여! ' . REGISTER_FAILED,
            'MESSAGE': '(뭐라고 하는지 모르겠다. 그냥 가만히 있어야 겠다.)',
            'MESSAGE--FAILED': REGISTER_FAILED,
        };
    }

    getMethods() {
        const s3 = new AWS.S3({
            'region': process.env.AWS_REGION,
        });

        return new Promise((resolve, reject) => {
            s3.getObject({
                'Bucket': 'ipf-chatbot',
                'Key': 'health/health_methods.json',
            }, (err, data) => {
                if (err) return reject(err);

                const response = JSON.parse(data.Body.toString());
                resolve(response.methods);
            });
        });
    }

    async getMethodCard() {
        const turtle = String.fromCodePoint(0x1F422);

        let method = null;

        try {
            const time = Util.convertUTCTimeToLocalTime(new Date().toISOString(), false);
            const match = time.match(/\d{1,2}\/\d{1,2}\/\d{4}, (\d{1,2})\:\d{1,2}\:\d{1,2}/);
            let idx = parseInt(match[1]);
            let pad = 9;

            do {
                idx = idx - pad;
                pad--;
            } while (idx > 7);

            const methods = await this.getMethods();
            method = methods[idx];

        } catch (err) {
        }

        const widgets = [
            {
                'image': {
                    'imageUrl': `${ process.env.HEALTH_DATA_URL }/${ method.image }`,
                },
            },
            {
                'keyValue': {
                    'topLabel': 'Method',
                    'content': method.name,
                    'contentMultiline': 'true',
                }
            },
        ];

        const how_to = method.how_to.map((step, idx) => {
            return `<b>${ idx + 1 }.</b> ${ step }`;
        }).join("\n");

        const method_how = {
            'textParagraph': {
                'text': how_to,
            },
        };

        return {
            'cards': [
                {
                    'header': {
                        'title': `${ turtle } 스트레칭 할 시간입니다!`,
                    },
                    'sections': [{
                        widgets
                    }, {
                        'widgets': [method_how]
                    }],
                }
            ],
        };
    }

    sendRemedy() {
        return new Promise((resolve, reject) => {
            this.getMethodCard().then(message => {
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

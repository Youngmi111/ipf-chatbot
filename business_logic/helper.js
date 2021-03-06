const AWS = require('aws-sdk');
const fs = require('fs');

const Util = require('./util');

const DateHelper = require('./date_helper');

const Helper = {
    setAuth(bot_id) {
        return new Promise((resolve, reject) => {
            const s3 = new AWS.S3({
                region: process.env.AWS_REGION
            });

            const auth_file = fs.createWriteStream('/tmp/auth.json');
            auth_file.on('close', () => {
                resolve(true);
            });

            const credentials = `${process.env.ENV}/${bot_id}-auth.json`;

            s3.getObject({
                'Bucket': 'ipf-chatbot',
                'Key': credentials,

            }).createReadStream().on('error', (err) => {
                throw new Error(`cannot download ${credentials.substr(credentials.indexOf('/') + 1)}`);
            }).pipe(auth_file);
        });
    },
};

Helper.Date = DateHelper;

Helper.DynamoDB = (() => {
    const client = new AWS.DynamoDB({
        region: process.env.AWS_REGION
    });

    return {
        get(params) {
            return Util.promisify(callback => client.getItem(params, callback));
        },

        query(params) {
            return Util.promisify(callback => client.query(params, callback));
        },

        add(params) {
            return Util.promisify(callback => client.putItem(params, callback));
        },

        delete(params) {
            return Util.promisify(callback => client.deleteItem(params, callback));
        },
    };
})();

module.exports = Helper;
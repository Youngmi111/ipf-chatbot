const AWS = require('aws-sdk');
const fs = require('fs');
const Holidays = require('date-holidays');

const Util = require('./util');

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

Helper.Date = {
    DAY: ['일', '월', '화', '수', '목', '금', '토', '일'],
    microSecondsForOneDay: 60 * 60 * 24 * 1000,

    isWeekday(date) {
        const day = date.getDay();
        return day > 0 && day < 6;
    },

    isWorkingDay(now = Date.now()) {
        const date = new Date(now);

        if (!this.isWeekday(date)) return false;

        const hd = new Holidays('KR');
        return hd.isHoliday(date) === false;
    },

    getHumanReadableDateFromDatetime(datetime) {
        return `${ datetime.getFullYear() }년 ${ (datetime.getMonth() + 1) }월 ${ datetime.getDate() }일 ${ this.DAY[datetime.getDay()]}요일`;
    },

    getRemainingDays(currentDateTime, eventDateTime) {
        return Math.floor((eventDateTime.getTime() - currentDateTime.getTime()) / this.microSecondsForOneDay);
    },

    isDDay(currentDateTime, eventDateTime) {
        return eventDateTime.getTime() - currentDateTime.getTime() < this.microSecondsForOneDay;
    },

    getAvailableDate(dateTime, findInPast = true) {
        while (!this.isWorkingDay(dateTime)) {
            dateTime += findInPast ? this.microSecondsForOneDay * -1 : this.microSecondsForOneDay;
        }

        return dateTime;
    },

    getWorkingDay(since, daysBefore) {
        while (daysBefore > 0) {
            since -= this.microSecondsForOneDay;

            if (since === this.getAvailableDate(since)) daysBefore--;
        }

        return since;
    },

    getTheFirstWorkingDayOfMonth(dateTime = Date.now()) {
        const now = new Date(dateTime);

        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        return this.getAvailableDate(firstDayOfMonth, false);
    },

    isTheFirstWorkingDayOfMonth(now = new Date()) {
        return now.getDate() === new Date(this.getTheFirstWorkingDayOfMonth(now.getTime())).getDate();
    },
};

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
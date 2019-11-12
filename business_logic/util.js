const Util = {
    promisify(func) {
        return new Promise((resolve, reject) => func((err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        }));
    },

    convertUTCTimeToLocalTime(utc_time, hour12 = true, timezone = 'Asia/Seoul') {
        return new Date(utc_time).toLocaleString('en-US', {
            'timeZone': timezone,
            hour12,
        });
    },
};

module.exports = Util;

'use strict';

const Helper = require('../business_logic/helper');
const Crawler = require('../business_logic/docs_crawler');

const response = {
    statusCode: 200,
    body: '',
};

module.exports.googleDocsCrawler = async (event) => {
    await Helper.setAuth('iPF_ANNOUNCE_BOT');
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/auth.json';

    try {
        await Crawler.run(process.env.OFFICIAL_DOCS.split(','), Crawler.store);

    } catch (err) {
        response.statusCode = 400;
        response.body = JSON.stringify({
            'message': err.message,
        });
    }

    return response;
};

module.exports.ipfCultureDocs = async (event) => {
    await Helper.setAuth('iPF_ANNOUNCE_BOT');
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/auth.json';

    const documentId = event.pathParameters.docId;

    try {
        await Crawler.run([documentId], async tasks => {
            const documentElements = await Promise.all(tasks);
            const content = documentElements[0].map(doc => {
                return doc;
            });

            response.body = JSON.stringify(content);
        });

    } catch (err) {
        response.statusCode = 400;
        response.body = JSON.stringify({
            'message': err.message,
        });
    }

    return response;
};

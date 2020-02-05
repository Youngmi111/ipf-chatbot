const Storage = require('./docs_storage_helper');

module.exports = {
    async findContents(search) {
        const db = new Storage();
        const results = await db.search(search);

        return results.hits.map(result => {
            return result._source;
        });
    },

    async generateMessage(docs) {
        const mainDoc = docs.shift();

        const sections = [
            {
                'widgets': [
                    {
                        'keyValue': {
                            'topLabel': 'Title',
                            'content': mainDoc.title,
                        },
                    }, {
                        'keyValue': {
                            'topLabel': 'Details',
                            'content': mainDoc.content,
                            'contentMultiline': true,
                        }
                    }
                ],
            }, {
                'widgets': [{
                    'buttons': [{
                        'textButton': {
                            'text': '문서로 보기',
                            'onClick': {
                                'openLink': {
                                    'url': `https://docs.google.com/document/d/${ mainDoc.docId }/edit#heading=${ mainDoc.headingId }`
                                },
                            },
                        },
                    }],
                }],
            }
        ];

        if (docs.length > 0) {
            const additionalDocs = docs.map(docData => {
               return {
                   'buttons': [{
                       'textButton': {
                           'text': docData.title,
                           'onClick': {
                               'openLink': {
                                   'url': `https://docs.google.com/document/d/${ docData.docId }/edit#heading=${ docData.headingId }`
                               },
                           },
                       },
                   }],
               }
            });

            sections.push({
                'header': '원하는 답을 못찾으셨다면?',
                'widgets': additionalDocs
            });
        }

        return {
            'cards': [{
                sections
            }]
        };
    },
};

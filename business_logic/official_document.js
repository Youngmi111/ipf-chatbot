const OfficialDocument = {
    DOCUMENTS: {
        'ANNUAL_LEAVE': {
            'title': 'iPF 휴가신청서',
            'url': process.env.ANNUAL_LEAVE_URL,
        },
        'SELF_TRAINING': {
            'title': 'iPF 역량개발비신청서',
            'url': process.env.SELF_TRAINING_URL,
        },
        'BUY_REQUEST': {
            'title': 'iPF 구매신청서',
            'url': process.env.BUY_REQUEST_URL,
        },
    },

    getRequestedDocumentId(message) {
        let docId = '';

        if (/(휴가|연차)/.test(message)) {
            docId = 'ANNUAL_LEAVE';

        } else if (/(역량 개발비|자기 개발|자기 계발|자기개발|자기계발)/.test(message)) {
            docId = 'SELF_TRAINING';

        } else if (/(구매|구입|비품|사무용품)/.test(message)) {
            docId = 'BUY_REQUEST';
        }

        return docId;
    },

    generateMessageForDocumentLink(message) {
        const docId = this.getRequestedDocumentId(message);
        const document = this.DOCUMENTS[docId];

        return `*${ document.title }*
${ document.url }`;
    },
};

module.exports = OfficialDocument;

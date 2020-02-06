const { google } = require('googleapis');

const Util = require('./util');

module.exports = class {
    constructor(documentId) {
        this.SCOPE = 'https://www.googleapis.com/auth/documents.readonly';
        this.DOCUMENT_ID = documentId;
        this.CONTENT_ELEMENT_TYPE = ['paragraph', 'table'];
    }

    isElementContainsContent(element) {
        return this.CONTENT_ELEMENT_TYPE.find(type => {
            return Object.keys(element).includes(type);
        });
    }

    isHeadingContent(element) {
        return element.hasOwnProperty('paragraphStyle') && element.paragraphStyle.hasOwnProperty('namedStyleType') && element.paragraphStyle.namedStyleType.startsWith('HEADING');
    }

    parseContent(contentElement) {
        let parsed = [];

        let headingId = null;

        if (this.isElementContainsContent(contentElement)) {
            if (contentElement.hasOwnProperty('paragraph')) {

                if (this.isHeadingContent(contentElement.paragraph)) {
                    headingId = contentElement.paragraph.paragraphStyle.headingId;
                }

                let content = '';

                contentElement.paragraph.elements.forEach(pElement => {
                    if (pElement.hasOwnProperty('textRun')) {
                        content = pElement.textRun.content.replace('<', '&lt;');
                        content = content.replace('>', '&gt;');

                        if (pElement.textRun.textStyle.hasOwnProperty('link')) {
                            content = `<a href="${ pElement.textRun.textStyle.link.url }">${ content }</a>`;
                        }

                        parsed.push(content);
                    }
                });

                if (!headingId && contentElement.paragraph.hasOwnProperty('bullet')) {
                    parsed.unshift('* ');
                }

            } else if (contentElement.hasOwnProperty('table')) {
                contentElement.table.tableRows.forEach(row => {
                    row.tableCells.forEach(cell => {
                        cell.content.forEach(cellContent => {
                            parsed.push(this.parseContent(cellContent).content);
                        });
                    });
                });
            }
        }

        return {
            content: parsed.join(''),
            headingId,
        };
    }

    getStructuredData(documentData) {
        let document = {};

        let elements = [];
        documentData.forEach(element => {
            elements.push(this.parseContent(element));
        });

        let headingId = '';
        while(elements.length > 0) {
            const element = elements.shift();

            if (element.content === '\n' || element.content.length < 1) continue;

            if (element.headingId) {
                headingId = element.headingId;

                document[headingId] = {};
                document[headingId].title = element.content;

            } else {
                if (document[headingId]) document[headingId].content = element.content;
            }
        }

        return Object.entries(document).map(([headingId, details]) => {
            return Object.assign({
                headingId,
            }, details);
        });
    }

    async getContent() {
        const auth = await google.auth.getClient({
            scopes: [this.SCOPE]
        });

        const docs = await google.docs({
            version: 'v1',
            auth,
        });

        return Util.promisify(callback => docs.documents.get({
            documentId: this.DOCUMENT_ID,
        }, callback)).then(response => {
            const data = this.getStructuredData(response.data.body.content);

            return data.map(element => {
                return Object.assign({
                    'docId': this.DOCUMENT_ID,
                }, element);
            });
        });
    }
};

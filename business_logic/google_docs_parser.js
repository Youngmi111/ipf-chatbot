const { google } = require('googleapis');

const Util = require('./util');

module.exports = class {
    constructor(documentId) {
        this.SCOPE = 'https://www.googleapis.com/auth/documents.readonly';
        this.DOCUMENT_ID = documentId;
        this.CONTENT_ELEMENT_TYPE = ['paragraph', 'table'];
        this.attachments = [];
    }

    isElementContainsContent(element) {
        return this.CONTENT_ELEMENT_TYPE.find(type => {
            return Object.keys(element).includes(type);
        });
    }

    isTableContent(element) {
        return element.hasOwnProperty('table');
    }

    isHeadingContent(element) {
        return element.hasOwnProperty('paragraphStyle') && element.paragraphStyle.hasOwnProperty('namedStyleType') && element.paragraphStyle.namedStyleType.startsWith('HEADING');
    }

    parseContent(contentElement) {
        let parsed = [];

        let headingId = null;
        let depth = null;

        if (this.isTableContent(contentElement)) {
            let tableContent = '';

            contentElement.table.tableRows.forEach((row, idx) => {
                let rowContent = '';
                const colType = idx > 0 ? 'td' : 'th';

                row.tableCells.forEach(cell => {
                    cell.content.forEach(cellContent => {
                        rowContent += `<${ colType }>${ this.parseContent(cellContent).content }</${ colType }>`;
                    });
                });

                tableContent += `<tr>${ rowContent }</tr>`;
            });

            tableContent = `<table>${ tableContent }</table>`;
            parsed.push(tableContent);

        } else if (this.isElementContainsContent(contentElement)) {
            if (contentElement.hasOwnProperty('paragraph')) {
                if (this.isHeadingContent(contentElement.paragraph)) {
                    headingId = contentElement.paragraph.paragraphStyle.headingId;

                    const styleType = contentElement.paragraph.paragraphStyle.namedStyleType;
                    if (styleType.startsWith('HEADING_')) depth = parseInt(styleType.substr(-1, 1));
                }

                let content = '';

                contentElement.paragraph.elements.forEach(pElement => {
                    if (pElement.hasOwnProperty('textRun')) {
                        content = pElement.textRun.content.replace('<', '&lt;');
                        content = content.replace('>', '&gt;');

                        if (pElement.textRun.textStyle.hasOwnProperty('link')) {
                            content = `<a href="${ pElement.textRun.textStyle.link.url }" target="_blank">${ content }</a>`;
                        }

                        parsed.push(content);

                    } else if (pElement.hasOwnProperty('inlineObjectElement')) {
                        content = `<img src="${ this.attachments[pElement.inlineObjectElement.inlineObjectId].imageProperties.contentUri }">`;
                        parsed.push(content);
                    }
                });

                if (!headingId && contentElement.paragraph.hasOwnProperty('bullet')) {
                    parsed.unshift('* ');
                }
            }
        }

        return {
            content: parsed.join(''),
            headingId,
            depth,
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

                document[headingId] = {
                    'content': '',
                };
                document[headingId].title = element.content;
                document[headingId].depth = element.depth;

            } else {
                if (document[headingId]) document[headingId].content += element.content;
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
            if (response.data.hasOwnProperty('inlineObjects')) {
                Object.entries(response.data.inlineObjects).forEach(([key, val]) => {
                    this.attachments[key] = val.inlineObjectProperties.embeddedObject;
                });
            }

            const data = this.getStructuredData(response.data.body.content);

            return data.map(element => {
                return Object.assign({
                    'docId': this.DOCUMENT_ID,
                }, element);
            });
        }).catch(err => {
            console.log(err);
        });
    }
};

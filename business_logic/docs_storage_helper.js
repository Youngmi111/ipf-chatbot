const ESClient = require('aws-elasticsearch-client');

module.exports = class {
    constructor() {
        this.DOC_INDICE_ID = process.env.DOC_INDICE_ID;

        const option = {
            host: process.env.DOC_ES_HOST,
        };

        if (process.env.ENV == 'local') option.port = 9200;

        this.client = ESClient.create();
    }

    checkIndiceExists() {
        return this.client.indices.exists({
            index: this.DOC_INDICE_ID
        }).then(response => {
            return response.status === 200;

        }).catch(err => {
            console.log(err.message);
            return false;
        });
    }

    checkDocExist(docId) {
        return this.client.exists({
            index: this.DOC_INDICE_ID,
            id: docId,
            type: '_doc'
        }).then(response => {
            return response;

        }).catch(err => {
            console.log(err);
            return false;
        });
    }

    createIndice() {
        return this.client.indices.create({
            index: this.DOC_INDICE_ID
        }).then(response => {
            return response.acknowledged;

        }).catch(err => {
            console.log(err.message);
            return false;
        });
    }

    async updateDocument(docData) {
        const docId = `${ docData.headingId }@${ docData.docId }`;
        const opType = await this.checkDocExist(docId) ? 'index' : 'create';

        return this.client.index({
            index: this.DOC_INDICE_ID,
            id: docId,
            type: '_doc',
            body: docData,
            opType
        });
    }

    async update(data) {
        try {
            if (await this.checkIndiceExists()) await this.createIndice();

            let tasks = [];

            data.forEach(doc => {
                tasks.push(this.updateDocument(doc));
            });

            await Promise.all(tasks);
            return true;

        } catch (err) {
            console.log(err);
            return false;
        }
    }

    async search(q) {
        const keywords = q.split(' ').map(keyword => {
            return `*${ keyword.trim() }*`;
        });

        const query = {
            'query_string': {
                'fields': ['title^2', 'content'],
                'query': `${ keywords[0] }^1.5`
            }
        };

        if (keywords.length > 1) {
            query.query_string.query += ` AND (${ keywords.splice(1).join(' OR ') })`;
        }

        try {
            return await this.client.search({
                index: this.DOC_INDICE_ID,
                type: '_doc',
                body: {
                    query
                }
            }).then(response => {
                return response.hits;
            });

        } catch (err) {
            throw err;
        }
    }
};

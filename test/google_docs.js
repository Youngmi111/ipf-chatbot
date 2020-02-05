require('dotenv').config();

const Storage = require('../business_logic/docs_storage_helper');
const GoogleDocs = require('../business_logic/google_docs_parser');
const Crawler = require('../business_logic/docs_crawler');

const chai = require('chai');
const expect = chai.expect;

describe('Document Storage', function() {
    const es = new Storage();

    it('check indice exist', async () => {
        const exist = await es.checkIndiceExists();
        console.log({exist});
    });

    it('create indice', async () => {
        const create = await es.createIndice();
        console.log(create);
    });

    it('check document exist', async () => {
        const docId = process.env.OFFICIAL_DOCS;
        const exist = await es.checkDocExist(docId);
        console.log({exist});
    });

    it('update document', async () => {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = process.cwd() + '/auth.json';

        const docId = process.env.OFFICIAL_DOCS;
        const doc = new GoogleDocs(docId);
        const docData = await doc.getContent();

        const result = await es.update(docData);

        console.log({result});
    });

    it('search', async () => {
        const search = '사업자 등록 번호가 뭐야?';
        const result = await es.search(search);

        console.log(result.hits);
    });
});

describe('crawler', function() {
   it('run', async () => {
       process.env.GOOGLE_APPLICATION_CREDENTIALS = process.cwd() + '/auth.json';

       Crawler.run(process.env.OFFICIAL_DOCS.split(','));
   });
});
const GoogleDocs = require('./google_docs_parser');
const Storage = require('./docs_storage_helper');

module.exports = {
    async run(docIds) {
        let getDataTasks = [];

        docIds.forEach(docId => {
            const parser = new GoogleDocs(docId);
            getDataTasks.push(parser.getContent());
        });

        try {
            const storage = new Storage();

            const documents = await Promise.all(getDataTasks);

            let updateTasks = [];
            documents.forEach(docs => {
                docs.forEach(doc => {
                    updateTasks.push(storage.updateDocument(doc));
                });
            });

            await Promise.all(updateTasks);
            return true;

        } catch (err) {
            console.log(err.message);
            return false;
        }
    }
};

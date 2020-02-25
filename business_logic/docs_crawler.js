const GoogleDocs = require('./google_docs_parser');
const Storage = require('./docs_storage_helper');

module.exports = {
    async store(tasks) {
        const storage = new Storage();

        const documents = await Promise.all(tasks);

        return await storage.update(documents[0]);
    },

    getTasksForGettingContents(docIds) {
        let getDataTasks = [];

        docIds.forEach(docId => {
            const parser = new GoogleDocs(docId);
            getDataTasks.push(parser.getContent());
        });

        return getDataTasks;
    },

    async run(docIds, callback) {
        const getDataTasks = this.getTasksForGettingContents(docIds);

        try {
            return await callback(getDataTasks);

        } catch (err) {
            console.log(err.message);
            return false;
        }
    }
};

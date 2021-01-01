const fs = require('fs');
const debug = require('debug')('epub-press:tests');
const Database = require('../lib/database');

module.exports = async () => {
    if (process.env.__SKIP_DB_TESTS__) {
        return;
    }

    const database = new Database();

    const isDbAvailable = await database.isAvailable();
    if (isDbAvailable && database.isSqlite() && database.config.storage) {
        debug(`removing sqlite database ${database.config.storage}`);
        fs.unlinkSync(database.config.storage);
    }
};

const debug = require('debug')('epub-press:tests');
const Database = require('../lib/database');

module.exports = async () => {
    const database = new Database();

    const isDbAvailable = await database.isAvailable();
    if (isDbAvailable) {
        await database.createDatabase(database.config.database);
        await database.migrate();
        await database.disconnect();
    } else {
        process.env.__SKIP_DB_TESTS__ = true;
        debug('skipping database tests -- db unavailable');
    }
};

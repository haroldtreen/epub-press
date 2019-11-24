const Database = require('../lib/database');

module.exports = async () => {
    const database = new Database();

    const isDbAvailable = await database.isAvailable();
    if (isDbAvailable) {
        await database.createDatabase(database.config.database);
        await database.migrate();
        await database.disconnect();
        process.env.__SKIP_DB_TESTS__ = false;
    } else {
        process.env.__SKIP_DB_TESTS__ = true;
    }
};

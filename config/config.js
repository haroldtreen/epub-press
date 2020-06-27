const Config = require('../lib/config');

module.exports = {
    development: {
        username: Config.DB_USERNAME,
        password: Config.DB_PASSWORD,
        database: 'epubpress_development',
        host: Config.DB_HOST,
        dialect: Config.DB_DIALECT,
        omitNull: true,
        storage: './tmp/db_dev.sqlite',
    },
    test: {
        username: Config.DB_USERNAME,
        password: Config.DB_PASSWORD,
        database: 'epubpress_test',
        host: Config.DB_HOST,
        dialect: Config.DB_DIALECT,
        omitNull: true,
        storage: './tmp/db_test.sqlite',
        logging: false,
    },
    production: {
        username: Config.DB_USERNAME,
        password: Config.DB_PASSWORD,
        database: 'epubpress_production',
        host: Config.DB_HOST,
        dialect: Config.DB_DIALECT,
        omitNull: true,
    },
};

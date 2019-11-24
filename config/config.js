const Config = require('../lib/config');

module.exports = {
    development: {
        username: Config.DB_USERNAME,
        password: Config.DB_PASSWORD,
        database: 'epubpress_development',
        host: Config.DB_HOST,
        dialect: 'postgres',
        omitNull: true,
    },
    test: {
        username: Config.DB_USERNAME,
        password: Config.DB_PASSWORD,
        database: 'epubpress_test',
        host: Config.DB_HOST,
        dialect: 'postgres',
        omitNull: true,
    },
    production: {
        username: Config.DB_USERNAME,
        password: Config.DB_PASSWORD,
        database: 'epubpress_production',
        host: Config.DB_HOST,
        dialect: 'postgres',
        omitNull: true,
    },
};

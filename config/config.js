const Config = require('../lib/config');

const dbDialectConfig = {
    sqlite: {
        storage: Config.DB_STORAGE,
    },
    postgres: {
        host: Config.DB_HOST,
    },
};

module.exports = {
    development: {
        username: Config.DB_USERNAME,
        password: Config.DB_PASSWORD,
        database: 'epubpress_development',
        dialect: Config.DB_DIALECT,
        omitNull: true,
        ...dbDialectConfig[Config.DB_DIALECT.toLowerCase()],
    },
    test: {
        username: Config.DB_USERNAME,
        password: Config.DB_PASSWORD,
        database: 'epubpress_test',
        dialect: Config.DB_DIALECT,
        omitNull: true,
        logging: false,
        ...dbDialectConfig[Config.DB_DIALECT.toLowerCase()],
    },
    production: {
        username: Config.DB_USERNAME,
        password: Config.DB_PASSWORD,
        database: 'epubpress_production',
        dialect: Config.DB_DIALECT,
        omitNull: true,
        ...dbDialectConfig[Config.DB_DIALECT.toLowerCase()],
    },
};

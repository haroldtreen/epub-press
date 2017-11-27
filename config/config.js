module.exports = {
    development: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: 'epubpress_development',
        host: '127.0.0.1',
        dialect: 'postgres',
        omitNull: true,
    },
    test: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: 'epubpress_test',
        host: '127.0.0.1',
        dialect: 'postgres',
        omitNull: true,
    },
    production: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: 'epubpress_production',
        host: process.env.DB_HOST,
        dialect: 'postgres',
        omitNull: true,
    },
};

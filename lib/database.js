const path = require('path');

const Sequelize = require('sequelize');
const { Client } = require('pg');
const Umzug = require('umzug');

const env = process.env.NODE_ENV || 'development';
const DEFAULT_CONFIG = require('../config/config')[env];

class Database {
    constructor(config) {
        this.config = config || DEFAULT_CONFIG;
        this.SequelizeDb = Database.createSeqelize(config);
    }

    static createSeqelize(config = DEFAULT_CONFIG) {
        if (config.use_env_variable) {
            return new Sequelize(process.env[config.use_env_variable]);
        }
        return new Sequelize(config.database, config.username, config.password, config);
    }

    isAvailable() {
        if (this.isSqlite()) {
            return Promise.resolve(true);
        }

        return this.SequelizeDb.authenticate()
            .then(() => true)
            .catch(() => false);
    }

    createDatabase(dbName) {
        if (this.isSqlite()) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const { username, password, host } = this.config;
            this.client = new Client({
                user: username,
                password,
                host,
                database: 'postgres',
            });
            this.client.connect();
            this.client.query(`CREATE DATABASE ${dbName}`, (err) => {
                this.client.end();
                if (err && err.message.toLowerCase().includes('exists')) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }

    disconnect() {
        if (this.client) {
            this.client.end();
        }
        this.SequelizeDb.close();
    }

    migrate() {
        const umzug = new Umzug({
            storage: 'sequelize',

            storageOptions: {
                sequelize: this.SequelizeDb,
            },

            migrations: {
                params: [this.SequelizeDb.getQueryInterface()],
                path: path.join(__dirname, '../migrations'),
            },
        });

        return umzug.up();
    }

    isSqlite() {
        return this.config.dialect === 'sqlite';
    }
}

module.exports = Database;

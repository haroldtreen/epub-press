
const path = require('path');

const { Client } = require('pg');
const Umzug = require('umzug');

const SequelizeDb = require('../models');

const env = process.env.NODE_ENV || 'development';
const DEFAULT_CONFIG = require('../config/config')[env];

class Database {
    constructor(config) {
        this.config = config || DEFAULT_CONFIG;
        this.SequelizeDb = SequelizeDb;
    }

    isAvailable() {
        const { username, password, host } = this.config;
        this.client = new Client({
            user: username, password, host, database: 'postgres',
        });
        return new Promise((resolve) => {
            this.client.connect((e) => {
                this.client.end();
                if (e) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    createDatabase(dbName) {
        return new Promise((resolve, reject) => {
            const { username, password, host } = this.config;
            this.client = new Client({
                user: username, password, host, database: 'postgres',
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
        this.client.end();
        this.SequelizeDb.sequelize.close();
    }

    migrate() {
        const { sequelize, Sequelize } = this.SequelizeDb;
        const umzug = new Umzug({
            storage: 'sequelize',

            storageOptions: {
                sequelize,
            },

            migrations: {
                params: [
                    sequelize.getQueryInterface(),
                    Sequelize,
                ],
                path: path.join(__dirname, '../migrations'),
            },
        });

        return umzug.up();
    }
}

module.exports = Database;

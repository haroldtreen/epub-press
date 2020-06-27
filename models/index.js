'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const Database = require('../lib/database');

const basename = path.basename(module.filename);

const db = {};
const sequelizeDb = Database.createSeqelize();

fs.readdirSync(__dirname)
    .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
    .forEach((file) => {
        const model = sequelizeDb.import(path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelizeDb;
db.Sequelize = Sequelize;

module.exports = db;

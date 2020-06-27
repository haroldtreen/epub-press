'use strict';

const sequelize = require('sequelize');

module.exports = {
    up(queryInterface, Sequelize) {
        if (!Sequelize) {
            Sequelize = sequelize;
        }
        return queryInterface.createTable('Books', {
            id: {
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            title: {
                type: Sequelize.STRING,
            },
            sections: {
                type: Sequelize.JSON,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    down(queryInterface) {
        return queryInterface.dropTable('Books');
    },
};

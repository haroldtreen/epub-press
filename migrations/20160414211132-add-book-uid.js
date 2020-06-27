'use strict';

const sequelize = require('sequelize');

module.exports = {
    up: (queryInterface, Sequelize) => {
        if (!Sequelize) {
            Sequelize = sequelize;
        }
        return queryInterface.addColumn('Books', 'uid', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: '123456',
        });
    },
    down: (queryInterface) => queryInterface.removeColumn('Books', 'uid'),
};

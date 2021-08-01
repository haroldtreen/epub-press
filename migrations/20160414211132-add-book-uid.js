'use strict';

const Sequelize = require('sequelize');

module.exports = {
    up: (queryInterface) =>
        queryInterface.addColumn('Books', 'uid', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: '123456',
        }),
    down: (queryInterface) => queryInterface.removeColumn('Books', 'uid'),
};

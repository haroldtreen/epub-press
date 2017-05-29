'use strict';

module.exports = {
    up(queryInterface, Sequelize) {
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
    down(queryInterface, Sequelize) {
        return queryInterface.dropTable('Books');
    },
};

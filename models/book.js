'use strict';
module.exports = (sequelize, DataTypes) => {
    const Book = sequelize.define('Book', {
        id: DataTypes.INTEGER,
        title: DataTypes.STRING,
        sections: DataTypes.JSON,
    }, {
        classMethods: {
            associate: () => {},
        },
    });
    return Book;
};

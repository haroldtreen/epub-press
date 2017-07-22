'use strict';

module.exports = (sequelize, DataTypes) => {
    const Book = sequelize.define(
        'Book',
        {
            id: { type: DataTypes.INTEGER, primaryKey: true },
            title: DataTypes.STRING,
            sections: DataTypes.JSON,
            uid: DataTypes.STRING,
        },
        {
            classMethods: {
                associate: () => {},
            },
        }
    );
    return Book;
};

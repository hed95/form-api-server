"use strict";

const DataType = require("sequelize");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("role", {
            id: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataType.UUIDV4,
            },
            name: {
                type: DataType.STRING,
                allowNull: false,
            },
            description: {
                type: DataType.TEXT,
                allowNull: true,
            },
            active: {
                type: DataType.BOOLEAN,
                allowNull: false,
            },
        }, {
            schema: "public",
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize
            .query('DROP TABLE role');
    },
};

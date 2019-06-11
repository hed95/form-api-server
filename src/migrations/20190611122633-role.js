'use strict';

const DataType = require("sequelize");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("ROLE", {
            id: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false
            },
            createOn: {
                type: DataType.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataType.DATE,
                allowNull: false
            },
            name: {
                type: DataType.STRING,
                allowNull: false
            },
            description: {
                type: DataType.TEXT,
                allowNull: true
            },
            active: {
                type: DataType.BOOLEAN,
                allowNull: false
            }
        })
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('ROLE');
    }
};

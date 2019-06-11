'use strict';

const DataType = require("sequelize");

module.exports = {

    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("FORMCOMMENT", {
            ID: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataType.UUIDV4
            },
            createOn: {
                type: DataType.DATE,
                allowNull: false
            },
            createdBy: {
                type: DataType.STRING,
                allowNull: false
            },
            updatedAt: {
                type: DataType.DATE,
                allowNull: false
            },
            comment: {
                type: DataType.TEXT,
                allowNull: false
            }
        })
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('FORMCOMMENT');
    }
};

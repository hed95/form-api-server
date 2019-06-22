'use strict';

const DataType = require("sequelize");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("FORMVERSION", {
            versionId: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataType.UUIDV4
            },
            createdAt: {
                type: DataType.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataType.STRING,
                allowNull: false
            },
            createdBy: {
                type: DataType.STRING,
                allowNull: false
            },
            schema: {
                type: DataType.JSONB,
                allowNull: false
            },
            validFrom: {
                type: DataType.DATE,
                allowNull: false
            },
            validTo: {
                type: DataType.STRING,
                allowNull: true
            },
            formId: {
                type: DataType.UUID,
                references: {
                    model: "FORM",
                    key: "id"
                }
            },
            latest: {
                type: DataType.BOOLEAN,
                allowNull: false
            }
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('FORMVERSION');
    }
};

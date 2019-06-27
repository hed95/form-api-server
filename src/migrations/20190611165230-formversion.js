"use strict";

const DataType = require("sequelize");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("FORMVERSION", {
            versionId: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataType.UUIDV4,
            },
            createdOn: {
                type: DataType.DATE,
                allowNull: false,
            },
            updatedOn: {
                type: DataType.STRING,
                allowNull: false,
            },
            createdBy: {
                type: DataType.STRING,
                allowNull: false,
            },
            updatedBy: {
                type: DataType.STRING,
                allowNull: true,
            },
            schema: {
                type: DataType.JSONB,
                allowNull: false,
            },
            validFrom: {
                type: DataType.DATE,
                allowNull: false,
            },
            validTo: {
                type: DataType.STRING,
                allowNull: true,
            },
            formId: {
                type: DataType.UUID,
                references: {
                    model: {
                        tableName: "FORM",
                        schema: "formschema",
                    },
                    key: "id",
                },
            },
            latest: {
                type: DataType.BOOLEAN,
                allowNull: false,
            },
        }, {
            schema: "formschema",
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize
            .query('DROP TABLE formschema."FORMVERSION"');
    },
};

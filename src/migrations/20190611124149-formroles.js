"use strict";

const DataType = require("sequelize");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("FORMROLES", {
            id: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataType.UUIDV4,
            },
            formId: {
                type: DataType.UUID,
                allowNull: false,
                references: {
                    model: {
                        schema: "formschema",
                        tableName: "FORM",
                    },
                    key: "id",
                },

            },
            roleId: {
                type: DataType.UUID,
                allowNull: false,
                references: {
                    model: {
                        schema: "formschema",
                        tableName: "ROLE",
                    },
                    key: "id",
                },
            },
            createdAt: {
                type: DataType.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: DataType.STRING,
                allowNull: false,
            },
        }, {
            schema: "formschema",
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize
            .query('DROP TABLE formschema."FORMROLES"');
    },
};

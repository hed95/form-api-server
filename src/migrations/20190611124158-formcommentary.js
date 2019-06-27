"use strict";

const DataType = require("sequelize");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("FORMCOMMENTARY", {
            id: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataType.UUIDV4,
            },
            formId: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: {
                        tableName: "FORM",
                        schema: "formschema",
                    },
                    key: "id",
                },
            },
            commentId: {
                type: DataType.UUID,
                allowNull: false,
                references: {
                    model: {
                        tableName: "FORMCOMMENT",
                        schema: "formschema",
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
            .query('DROP TABLE formschema."FORMCOMMENTARY" CASCADE');
    },
};

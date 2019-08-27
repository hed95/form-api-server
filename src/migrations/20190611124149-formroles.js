"use strict";

const DataType = require("sequelize");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("formroles", {
            id: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataType.UUIDV4,
            },
            formid: {
                type: DataType.UUID,
                allowNull: false,
                references: {
                    model: {
                        schema: "public",
                        tableName: "form",
                    },
                    key: "id",
                },

            },
            roleid: {
                type: DataType.UUID,
                allowNull: false,
                references: {
                    model: {
                        schema: "public",
                        tableName: "role",
                    },
                    key: "id",
                },
            },
        }, {
            schema: "public",
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize
            .query("DROP TABLE formroles");
    },
};

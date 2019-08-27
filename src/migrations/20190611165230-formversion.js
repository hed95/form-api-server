"use strict";

const DataType = require("sequelize");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("formversion", {
            versionid: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataType.UUIDV4,
            },
            createdon: {
                type: DataType.DATE,
                allowNull: false,
            },
            createdby: {
                type: DataType.STRING,
                allowNull: false,
            },
            updatedby: {
                type: DataType.STRING,
                allowNull: true,
            },
            schema: {
                type: DataType.JSONB,
                allowNull: false,
            },
            validfrom: {
                type: DataType.DATE,
                allowNull: false,
            },
            validto: {
                type: DataType.STRING,
                allowNull: true,
            },
            formid: {
                type: DataType.UUID,
                references: {
                    model: {
                        tableName: "form",
                        schema: "public",
                    },
                    key: "id",
                },
            },
            latest: {
                type: DataType.BOOLEAN,
                allowNull: false,
            },
        }, {
            schema: "public",
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize
            .query("DROP TABLE formversion");
    },
};

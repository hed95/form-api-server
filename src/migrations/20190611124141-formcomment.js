"use strict";

const DataType = require("sequelize");

module.exports = {

    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("formcomment", {
            id: {
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
            comment: {
                type: DataType.TEXT,
                allowNull: false,
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
        }, {
            schema: "public",
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize
            .query('DROP TABLE formcomment');
    },
};

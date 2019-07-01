"use strict";

const DataType = require("sequelize");

module.exports = {

    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("FORMCOMMENT", {
            id: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataType.UUIDV4,
            },
            createOn: {
                type: DataType.DATE,
                allowNull: false,
            },
            createdBy: {
                type: DataType.STRING,
                allowNull: false,
            },
            comment: {
                type: DataType.TEXT,
                allowNull: false,
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
        }, {
            schema: "formschema",
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize
            .query('DROP TABLE formschema."FORMCOMMENT"');
    },
};

'use strict';

const DataType = require("sequelize");

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("FORMCOMMENTARY", {
            id: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataType.UUIDV4
            },
            formId: {
                type: DataType.UUID,
                primaryKey: true,
                allowNull: false,
                references: {
                    model: 'FORM', key: 'id'
                }
            },
            commentId: {
                type: DataType.UUID,
                allowNull: false,
                references: {
                    model: 'FORMCOMMENT', key: 'id'
                }
            },
            createdAt: {
                type: DataType.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataType.STRING,
                allowNull: false
            }
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('FORMCOMMENTARY');
    }
};

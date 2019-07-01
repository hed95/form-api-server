"use strict";

const DataType = require("sequelize");
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("FORM", {
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
      updatedOn: {
        type: DataType.DATE,
        allowNull: false,
      },
      createdBy: {
        type: DataType.STRING,
        allowNull: false,
      },
      updatedBy: {
        type: DataType.STRING,
        allowNull: false,
      },
    }, {
      schema: "formschema",
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize
        .query('DROP TABLE formschema."FORM"');
  },
};

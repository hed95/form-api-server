"use strict";

const DataType = require("sequelize");
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("form", {
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
      updatedon: {
        type: DataType.DATE,
        allowNull: false,
      },
      createdby: {
        type: DataType.STRING,
        allowNull: false,
      },
      updatedby: {
        type: DataType.STRING,
        allowNull: false,
      },
    }, {
      schema: "public",
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize
        .query("DROP TABLE form");
  },
};

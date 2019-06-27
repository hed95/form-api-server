"use strict";

module.exports = {

    up: (queryInterface, Sequelize) => {
        return queryInterface.createSchema("FORMSCHEMA");
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropAllSchemas({});
    },
};

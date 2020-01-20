"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.
                sequelize
                .query("ALTER TABLE formversion ALTER validto type TIMESTAMPTZ using(validto::TIMESTAMPTZ)");
    },
};

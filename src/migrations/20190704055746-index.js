"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface
            .sequelize
            .query('CREATE INDEX form_version_formid_idx ON formversion ("formid")')
            .then(() => {
            queryInterface
                .sequelize
                .query('CREATE  INDEX formcomment_formid_idx ON  formcomment ("formid")')
                .done();
            });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface
            .sequelize
            .query("DROP INDEX public.form_version_formid_idx, public.formcomment_formid_idx CASCADE");
    },
};

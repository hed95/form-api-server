"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface
            .sequelize
            .query('CREATE INDEX form_version_formid_idx ON "formschema"."FORMVERSION" ("formId")')
            .then(() => {
            queryInterface
                .sequelize
                .query('CREATE  INDEX formcomment_formid_idx ON  "formschema"."FORMCOMMENT" ("formId")')
                .done();
            });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface
            .sequelize
            .query("DROP INDEX formschema.form_version_formid_idx, formschema.formcomment_formid_idx CASCADE");
    },
};

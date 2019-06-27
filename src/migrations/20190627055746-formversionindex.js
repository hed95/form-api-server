"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface
            .sequelize
            .query('CREATE INDEX form_version_schema_gin ON "formschema"."FORMVERSION" USING gin (schema)')
            .then(() => {
            queryInterface
                .sequelize
                .query('CREATE INDEX form_version_schema_gin_jsonb ON "formschema"."FORMVERSION" ' +
                    'USING gin (schema jsonb_path_ops)')
                .done();
            });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface
            .sequelize
            .query("DROP INDEX formschema.form_version_schema_gin, " +
                "formschema.form_version_schema_gin_jsonb CASCADE");
    },
};

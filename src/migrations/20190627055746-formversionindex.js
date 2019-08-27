"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface
            .sequelize
            .query('CREATE INDEX form_version_schema_gin ON formversion USING gin (schema)')
            .then(() => {
            queryInterface
                .sequelize
                .query('CREATE INDEX form_version_schema_gin_jsonb ON formversion ' +
                    "USING gin (schema jsonb_path_ops)")
                .done();
            });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface
            .sequelize
            .query("DROP INDEX public.form_version_schema_gin, " +
                "public.form_version_schema_gin_jsonb CASCADE");
    },
};

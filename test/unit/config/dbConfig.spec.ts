import 'reflect-metadata';
import {expect} from "chai";

describe('dbConfig', () => {
    it('can get db config', () => {

        // @ts-ignore
        const config = require('../../../src/config/dbconfig');

        expect(config).to.be.not.null;
        expect(config.test).to.be.not.null;
        expect(config.test.dialect).to.be.eq('sqlite');
        expect(config.test.storage).to.be.eq(':memory:');

        expect(config.production).to.be.not.null;
        expect(config.production.username).to.be.not.null;
        expect(config.production.password).to.be.not.null;
        expect(config.production.database).to.be.not.null;
        expect(config.production.host).to.be.not.null;
        expect(config.production.port).to.be.not.null;
        expect(config.production.dialect).to.be.eq('postgres');

    });
});

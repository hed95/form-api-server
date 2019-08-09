import {expect} from 'chai';
import {ConfigValidator} from "../../../src/config/ConfigValidator";
import defaultAppConfig from "../../../src/config/defaultAppConfig";
import {ValidationResult} from "@hapi/joi";

describe('ConfigValidator', () => {
    it('can validate', () => {
      const validator = new ConfigValidator();
      const result : ValidationResult<any> = validator.validate(defaultAppConfig);
      expect(result.error).to.be.not.null;
    })
});

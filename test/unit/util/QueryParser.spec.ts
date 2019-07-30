import {QueryParser} from "../../../src/util/QueryParser";
import {expect} from 'chai';
import ResourceValidationError from "../../../src/error/ResourceValidationError";

describe("Query Parser", () => {

   const queryParser: QueryParser = new QueryParser();

   it('can parse queries', () => {
       const queries: string[] = ["title__eq__abc xxxx", "path__ne__1244"];
       const result = queryParser.parse(queries);
       expect(Object.keys(result).length).to.be.eq(2);
   });

   it('throws validation error if invalid operator', () => {
       try {
           const queries: string[] = ["title__blah__abc xxxx"];
           queryParser.parse(queries);
       } catch (e) {
           expect(e instanceof ResourceValidationError);
           const error = e as ResourceValidationError;
           expect(error.message).to.be.eq("Invalid operator");
       }
   });
   it('throws error if sql in value', () => {
       try {
           const queries: string[] = ['title__startsWith__\' DROP FORMVERSION'];
           queryParser.parse(queries);
       } catch (e) {
           expect(e instanceof ResourceValidationError);
           const error = e as ResourceValidationError;
           expect(error.message).to.be.eq("Potential SQL in value");
       }
   });
   it('can parse encoded', () => {
       const queries: string[] = ["title__eq__%kugnu%20besac%20tadom%"];
       const result = queryParser.parse(queries);
       expect(Object.keys(result).length).to.be.eq(1);
   });
   it('can handle in clause', () => {
       const queries: string[] = ['title__in__a|b|c|d'];
       const result = queryParser.parse(queries);
       expect(Object.keys(result).length).to.be.eq(1);
   });
});

import {QueryParser} from "../../../src/util/QueryParser";
import {expect} from 'chai';
import ValidationError from "../../../src/error/ValidationError";

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
           expect(e instanceof ValidationError);
           const error = e as ValidationError;
           expect(error.message).to.be.eq("Invalid operator");
       }

   });
});

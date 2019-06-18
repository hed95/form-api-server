import {QueryParser} from "../../../src/util/QueryParser";
import {expect} from 'chai';

describe("Query Parser", () => {

   const queryParser: QueryParser = new QueryParser();

   it('can parse queries', () => {
       const queries: string[] = ["title_eq_abc xxxx", "path_ne_1244"];
       const result = queryParser.parse(queries);
       expect(Object.keys(result).length).to.be.eq(2);
   });
});

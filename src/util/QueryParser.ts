import _ from 'lodash';

export class QueryParser {

    public parse(filters: string[]): object {
        const reg: RegExp = new RegExp('(\\w+)_(.*?)_(.*)');
        const convertedFilter: object = {};
        _.forEach(filters, (filter) => {
            if (reg.test(filter)) {
                const matches = filter.match(reg);
                const field = matches[1];
                const operator: symbol = Symbol.for(`${matches[2]}`);
                const value = matches[3];
                // @ts-ignore
                convertedFilter[field] = {
                    [operator]: value,
                };
            }
        });
        return convertedFilter;
    }

}

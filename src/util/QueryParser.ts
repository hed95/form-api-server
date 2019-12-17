import _ from 'lodash';
import {Op} from 'sequelize';
import ResourceValidationError from '../error/ResourceValidationError';
import xregexp from 'xregexp';

const paranoid = xregexp('((%27)|(\'))|(--)|((%23)|(#))', 'i');

export class QueryParser {

    private readonly operators: symbol[] = [
        Op.eq,
        Op.or,
        Op.ne,
        Op.in,
        Op.gt,
        Op.gte,
        Op.lt,
        Op.lte,
        Op.like,
        Op.regexp,
        Op.notRegexp,
        Op.notLike,
        Op.iLike,
        Op.endsWith,
        Op.contains,
        Op.startsWith,
    ];

    public parse(filters: string[]): [] {

        const lhs = '[\\w|.]+';
        const opEx = '\\w+';
        const rhs = '(.*)';

        const reg: RegExp = new RegExp(`(${lhs})__(${opEx})__(${rhs})`);
        const convertedFilter: [] = [];
        _.forEach(filters, (filter) => {
            if (reg.test(filter)) {

                const fieldMatch: number = 1;
                const operatorMatch: number = 2;
                const valueMatch: number = 3;

                const matches = filter.match(reg);
                const field = `schema.${matches[fieldMatch]}`;
                const operator: symbol = Symbol.for(`${matches[operatorMatch]}`);

                const foundOperator = _.find(this.operators, (op: symbol) => {
                    return op === operator;
                });

                if (!foundOperator) {
                    throw new ResourceValidationError('Invalid operator', [{
                        message: `${matches[operatorMatch]} invalid operator`,
                        type: 'invalid-operator',
                        path: [],
                        context: {},
                    }]);
                }

                const value = unescape(matches[valueMatch]);
                if (paranoid.test(value)) {
                    throw new ResourceValidationError('Potential SQL in value', [{
                        message: `${matches[valueMatch]} invalid`,
                        type: 'invalid-term',
                        path: [],
                        context: {},
                    }]);
                }
                // @ts-ignore
                convertedFilter.push({
                    [field] : {
                        [operator]: (operator === Op.in || operator === Op.or) ? value.split('|') : value,
                    },
                });
            }
        });
        return convertedFilter;
    }

}

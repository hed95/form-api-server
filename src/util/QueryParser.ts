import _ from 'lodash';
import {Op} from 'sequelize';
import ResourceValidationError from '../error/ResourceValidationError';
import xregexp from 'xregexp';

const paranoid = xregexp('((%27)|(\'))|(--)|((%23)|(#))', 'i');

export class QueryParser {

    private readonly operators: symbol[] = [
        Op.eq,
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

    public parse(filters: string[]): object {
        const reg: RegExp = new RegExp('(\\w+)__(.*?)__(.*)');
        const convertedFilter: object = {};
        _.forEach(filters, (filter) => {
            if (reg.test(filter)) {
                const matches = filter.match(reg);
                const field = `schema.${matches[1]}`;
                const operator: symbol = Symbol.for(`${matches[2]}`);

                const foundOperator = _.find(this.operators, (op: symbol) => {
                    return op === operator;
                });

                if (!foundOperator) {
                    throw new ResourceValidationError('Invalid operator', [{
                        message: `${matches[2]} invalid operator`,
                        type: 'invalid-operator',
                        path: [],
                        context: {},
                    }]);
                }

                const value = matches[3];
                if (paranoid.test(value)) {
                    throw new ResourceValidationError('Potential SQL in value', [{
                        message: `${matches[3]} invalid`,
                        type: 'invalid-term',
                        path: [],
                        context: {},
                    }]);
                }
                // @ts-ignore
                convertedFilter[field] = {
                    [operator]: value,
                };
            }
        });
        return convertedFilter;
    }

}

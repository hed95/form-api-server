import * as Joi from '@hapi/joi';
import vm from 'vm';
import _ from 'lodash';
import {util} from './Util';
import logger from '../util/logger';

const checkConditional = (component: any, row: any, data: any, recurse: boolean = false): boolean => {
    let isVisible = true;

    if (!component || !component.hasOwnProperty('key')) {
        return isVisible;
    }

    // Custom conditional logic. Need special case so the eval is isolated in a sandbox
    if (component.customConditional) {
        try {
            // Create the sandbox.
            const sandbox = vm.createContext({
                data,
                row,
            });

            // Execute the script.
            const script = new vm.Script(component.customConditional);
            script.runInContext(sandbox, {
                timeout: 250,
            });

            if (util.isBoolean(sandbox.show)) {
                isVisible = util.boolean(sandbox.show);
            }
        } catch (e) {
            logger.error(e);
        }
    } else {
        try {
            isVisible = util.checkCondition(component, row, data);
        } catch (err) {
            logger.error(err);
        }
    }

    // If visible and recurse, continue down tree to check parents.
    if (isVisible && recurse && component.parent && component.parent.type !== 'form') {
        return !component.parent || checkConditional(component.parent, row, data, true);
    } else {
        return isVisible;
    }
};

const custom = (type: string) => {
    return {
        name: 'custom',
        params: {
            component: Joi.any(),
            data: Joi.any(),
        },
        validate(params: any, value: any, state: any, options: any) {
            const component = params.component;
            const data = params.data;
            let row = state.parent;
            let valid = true;

            if (!_.isArray(row)) {
                row = [row];
            }

            for (const rowValue of row) {
                // Try a new sandboxed validation.
                try {
                    // Replace with variable substitutions.
                    const replace = /({{\s{0,}(.*[^\s]){1}\s{0,}}})/g;
                    component.validate.custom = component.validate.custom.replace(replace,
                        (match: any, $1: any, $2: any) => _.get(data, $2));

                    // Create the sandbox.
                    const sandbox = vm.createContext({
                        input: _.isObject(rowValue) ? util.getValue({data: rowValue}, component.key) : rowValue,
                        data,
                        row: rowValue,
                        scope: {data},
                        component,
                        valid,
                    });

                    // Execute the script.
                    const script = new vm.Script(component.validate.custom);
                    script.runInContext(sandbox, {
                        timeout: 100,
                    });
                    valid = sandbox.valid;
                } catch (err) {
                    // Say this isn't valid based on bad code executed...
                    valid = err.toString();
                }

                // If there is an error, then set the error object and break from iterations.
                if (valid !== true) {
                    return this.createError(`${type}.custom`, {message: valid}, state, options);
                }
            }

            return value; // Everything is OK
        },
    };
};

const json = (type: string) =>  {
    return {
        name: 'json',
        params: {
            component: Joi.any(),
            data: Joi.any(),
        },
        validate(params: any, value: any, state: any, options: any) {
            const component = params.component;
            const data = params.data;
            let row = state.parent;
            let valid = true;

            if (!_.isArray(row)) {
                row = [row];
            }

            for (const rowValue of row) {
                try {
                    valid = util.jsonLogic.apply(component.validate.json, {
                        data,
                        row: rowValue,
                    });
                } catch (err) {
                    valid = err.message;
                }

                // If there is an error, then set the error object and break from iterations.
                if (valid !== true) {
                    return this.createError(`${type}.json`, {message: valid}, state, options);
                }
            }

            return value; // Everything is OK
        },
    };
};

const hidden = (type: string) => {
    return {
        name: 'hidden',
        params: {
            component: Joi.any(),
            data: Joi.any(),
        },
        validate(params: any, value: any, state: any, options: any) {
            // If we get here than the field has thrown an error.
            // If we are hidden, sanitize the data and return true to override the error.
            // If not hidden, return an error so the original error remains on the field.

            const component = params.component;
            const data = params.data;
            const row = state.parent;

            const isVisible = checkConditional(component, row, data, true);

            if (isVisible) {
                return value;
            }

            return this.createError(`${type}.hidden`, {message: 'hidden with value'}, state, options);
        },
    };
};

const maxWords = (type: string) => {
    return {
        name: 'maxWords',
        params: {
            maxWords: Joi.any(),
        },
        validate(params: any, value: any, state: any, options: any) {
            if (value.trim().split(/\s+/).length <= parseInt(params.maxWords, 10)) {
                return value;
            }

            return this.createError(`${type}.maxWords`,
                {message: 'exceeded maximum words.'}, state, options);
        },
    };
};

const minWords = (type: string) => {
    return {
        name: 'minWords',
        params: {
            minWords: Joi.any(),
        },
        validate(params: any, value: any, state: any, options: any) {
            if (value.trim().split(/\s+/).length >= parseInt(params.minWords, 10)) {
                return value;
            }

            return this.createError(`${type}.minWords`,
                {message: 'does not have enough words.'}, state, options);
        },
    };
};

const getRules = (type: string) => [
    custom(type),
    json(type),
    hidden(type),
    maxWords(type),
    minWords(type),
];

export const JoiX = Joi.extend([
    {
        name: 'any',
        language: {
            custom: '{{message}}',
            json: '{{message}}',
            hidden: '{{message}}',
            select: '{{message}}',
            distinct: '{{message}}',
        },
        rules: getRules('any'),
    },
    {
        name: 'string',
        base: Joi.string(),
        language: {
            custom: '{{message}}',
            maxWords: '{{message}}',
            minWords: '{{message}}',
            json: '{{message}}',
            hidden: '{{message}}',
            select: '{{message}}',
            distinct: '{{message}}',
        },
        rules: getRules('string'),
    },
    {
        name: 'array',
        base: Joi.array(),
        language: {
            custom: '{{message}}',
            json: '{{message}}',
            hidden: '{{message}}',
            select: '{{message}}',
            distinct: '{{message}}',
        },
        rules: getRules('array'),
    },
    {
        name: 'object',
        base: Joi.object(),
        language: {
            custom: '{{message}}',
            json: '{{message}}',
            hidden: '{{message}}',
            select: '{{message}}',
            distinct: '{{message}}',
        },
        rules: getRules('object'),
    },
    {
        name: 'number',
        base: Joi.number(),
        language: {
            custom: '{{message}}',
            json: '{{message}}',
            hidden: '{{message}}',
            select: '{{message}}',
            distinct: '{{message}}',
        },
        rules: getRules('number'),
    },
    {
        name: 'boolean',
        base: Joi.boolean(),
        language: {
            custom: '{{message}}',
            json: '{{message}}',
            hidden: '{{message}}',
            select: '{{message}}',
            distinct: '{{message}}',
        },
        rules: getRules('boolean'),
    },
    {
        name: 'date',
        base: Joi.date(),
        language: {
            custom: '{{message}}',
            json: '{{message}}',
            hidden: '{{message}}',
            select: '{{message}}',
            distinct: '{{message}}',
        },
        rules: getRules('date'),
    },
]);

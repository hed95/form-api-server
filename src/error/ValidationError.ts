import {ValidationErrorItem} from '@hapi/joi';

class ValidationError extends Error {
    private readonly errors: ValidationErrorItem[];

    constructor(message: string, errors: ValidationErrorItem[]) {
        super(message);
        this.name = this.constructor.name;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }

    public get() {
        return this.errors;
    }
}

export default ValidationError;

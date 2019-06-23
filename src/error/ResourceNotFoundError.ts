class ResourceNotFoundError extends Error {

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
    }
}

export default ResourceNotFoundError;

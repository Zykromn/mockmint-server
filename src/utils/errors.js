export class AppError extends Error {
    constructor(messageCode, statusCode) {
        super(messageCode);
        this.statusCode = statusCode;
        this.messageCode = messageCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
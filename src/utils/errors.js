export class AppError extends Error {
    constructor(messageCode, statusCode) {
        super(messageCode);
        this.statusCode = statusCode;
        this.messageCode = messageCode;
        this.isOperational = true; // Флаг, отличающий наши контролируемые ошибки от системных (багов)
        Error.captureStackTrace(this, this.constructor);
    }
}
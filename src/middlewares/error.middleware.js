import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    if (!err) {
        return next();
    }

    const isOperational = err?.isOperational === true;
    if (!isOperational) {
        logger.error(`[UNEXPECTED ERROR] ${err.message || err}\nStack: ${err.stack || 'No stack'}`);
    }

    const statusCode = err.statusCode || 500;
    const messageCode = isOperational ? err.messageCode : 'SERVER_INTERNAL_ERROR';

    // 4. Отправляем ответ клиенту
    return res.status(statusCode).json({
        code: messageCode,
        ...(process.env.NODE_ENV === 'development' && { details: err.message || String(err) })
    });
};
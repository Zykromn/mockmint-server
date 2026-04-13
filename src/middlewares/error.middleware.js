import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    // Логируем только непредвиденные системные ошибки (500)
    if (!err.isOperational) {
        logger.error(`[UNEXPECTED ERROR] ${err.message}\nStack: ${err.stack}`);
    }

    const statusCode = err.statusCode || 500;
    const messageCode = err.isOperational ? err.messageCode : 'SERVER_INTERNAL_ERROR';

    return res.status(statusCode).json({
        code: messageCode,
        ...(process.env.NODE_ENV === 'development' && { details: err.message }) // В dev-режиме отдаем детали
    });
};
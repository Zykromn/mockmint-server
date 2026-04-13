export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], { abortEarly: false });

        if (error) {
            const code = source === 'body' ? 'INVALID_REQUEST_BODY' : 'INVALID_REQUEST_QUERY';
            return res.status(400).json({ code: req.validationErrorCode || code });
        }

        // Безопасная перезапись очищенных (через Joi) значений
        if (source === 'query') {
            // Очищаем старый объект и заливаем новые провалидированные данные
            Object.keys(req.query).forEach(key => delete req.query[key]);
            Object.assign(req.query, value);
        } else {
            // req.body и другие можно спокойно перезаписывать целиком
            req[source] = value;
        }

        next();
    };
};
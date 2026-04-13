export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], { abortEarly: false });

        if (error) {
            // Если нужно, здесь можно мапить детали ошибки (error.details)
            // Но по твоим контрактам мы отдаем просто код ошибки
            const code = source === 'body' ? 'INVALID_REQUEST_BODY' : 'INVALID_REQUEST_QUERY';
            return res.status(400).json({ code: req.validationErrorCode || code });
        }

        // Перезаписываем данные очищенными (от Joi) значениями
        req[source] = value;
        next();
    };
};
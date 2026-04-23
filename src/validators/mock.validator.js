import Joi from 'joi';


const MockValidator = {
    generate: Joi.object({
        mock_config: Joi.object({
            amount: Joi.number().integer().positive().required(),
            timed: Joi.boolean().required(),
            instant_check: Joi.boolean().required(),
            lang: Joi.string().valid('en', 'ch').required(),
            limit: Joi.number()
        }).required(),
        test_config: Joi.object().pattern(
            Joi.string(),
            Joi.number().integer().positive()
        ).min(1).required()
    }),

    getMock: Joi.object({
        mock_id: Joi.string().uuid().required()
    }),

    submit: Joi.object({
        mock_id: Joi.string().uuid().required(),
        task_id: Joi.string().uuid().required(),
        response: Joi.string().allow('').required()
    }),

    finish: Joi.object({
        mock_id: Joi.string().uuid().required(),
        time_spent: Joi.number().integer().min(0).required()
    }),

    getSlug: Joi.object({
        slug: Joi.string().required()
    })
};

export default MockValidator;
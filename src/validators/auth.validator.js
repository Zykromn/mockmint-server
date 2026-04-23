import Joi from 'joi';


const AuthValidator = {
    signup: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        alias: Joi.string().min(2).max(50).required()
    }),

    signin: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    verify: Joi.object({
        token: Joi.string().required()
    }),

    forgotPassword: Joi.object({
        email: Joi.string().email().required()
    }),

    resetPassword: Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(6).required()
    })
};

export default AuthValidator;
import Joi from 'joi';

export const AuthValidator = {
    signup: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        alias: Joi.string().min(2).max(50).required()
    }),

    signin: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    forgotPassword: Joi.object({
        email: Joi.string().email().required()
    }),

    resetPassword: Joi.object({
        token: Joi.string().required(),
        new_password: Joi.string().min(6).required()
    }),

    verifyEmail: Joi.object({
        token: Joi.string().required()
    })
};
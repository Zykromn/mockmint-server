import Joi from "joi";
import dotenv from "dotenv";
dotenv.config();


const envSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('dev', 'prod')
        .default('dev'),

    PORT: Joi.number()
        .default(5050),

    ORIGIN: Joi.string().required(),

    DATABASE_URL: Joi.string().required(),

    SESSION_SECRET: Joi.string().required(),

    GOOGLE_CLIENT_ID: Joi.string().required(),
    GOOGLE_CLIENT_SECRET: Joi.string().required(),
    GOOGLE_CALLBACK_URL: Joi.string().uri().required()
}).unknown();
const { value: envVars, error: error } = envSchema.validate(process.env, { abortEarly: false });
if (error) {
    let err_msg = '[FATAL] Dotenv configuration failed:';
    error.details.forEach((error) => { err_msg += (`  >> ${error.message}\n`) });
    console.error(err_msg);
    process.exit(0);
}

const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,

    cors: {
        origin: envVars.origin,
    },

    db: {
        url: envVars.DATABASE_URL,
    },

    session: {
        secret: envVars.SESSION_SECRET,
    },

    google: {
        clientId: envVars.GOOGLE_CLIENT_ID,
        clientSecret: envVars.GOOGLE_CLIENT_SECRET,
        callbackUrl: envVars.GOOGLE_CALLBACK_URL,
    },

    smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM
    }
}

export default config;
import logger from './src/utils/logger.js';
import config from './src/config/env.config.js';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import DB from './src/db/db.js';
import passportSetup from './src/config/passport.setup.js';

import AuthRoutes from './src/routes/auth.routes.js';
import MockRoutes from './src/routes/mock.routes.js';
import AccountRoutes from './src/routes/account.router.js';

import sessionMiddleware from './src/middlewares/sessions.js';
import { errorHandler } from './src/middlewares/error.middleware.js';


const app = express();

async function launch() {
    logger.info('========= MockMint Server =========');

    try {
        await DB.initialize();
        logger.info('Database launched successfully.');
    } catch (error) {
        logger.error(`Database error: ${error}`);
        process.exit(-1);
    }

    app.use(cors({
        origin: true,
        credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    try {
        app.use(sessionMiddleware);
        passportSetup(app);
        logger.info('Auth strategies initialized.');
    } catch (error) {
        logger.error(`AuthStrategies error: ${error}`);
        process.exit(-2);
    }

    app.use('/auth', AuthRoutes);
    app.use('/mocks', MockRoutes);
    app.use('/account', AccountRoutes);
    app.use(errorHandler);

    const PORT = config.port;
    app.listen(PORT, () => {
        logger.info(`===== Server started. ${PORT} =====`);
    });
}

launch();
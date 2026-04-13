import logger from './src/utils/logger.js';
import express from 'express';
import cors from 'cors';
import config from './src/config/env.config.js';
import passportSetup from './src/config/passport.setup.js';
import DB from './src/db/db.js';
import sessions from "./src/middlewares/sessions.js";
import AuthRoutes from "./src/routes/auth.routes.js";
import MockRoutes from './src/routes/mock.routes.js';


const app = express();

async function launch() {
    logger.info('========= MockMint Server =========');

    app.use(express.json());
    app.use(cors({
        origin: true,
        credentials: true
    }))

    try {
        await DB.initialize();
        logger.info('Database launched successfully.');
    } catch (error) {
        logger.error(`Database error: ${error}`);
        process.exit(-1);
    }

    app.use(sessions);
    try {
        passportSetup(app);
        logger.info('Auth strategies initialized.');
    } catch (error) {
        logger.error(`AuthStrategies error: ${error}`);
        process.exit(-2);
    }

    app.use('/auth', AuthRoutes)
    app.use('/mocks', MockRoutes);
    app.use((error, req, res, next) => {
        logger.error(`Server iternal: ${req.method} ${req.url}:`, error);
        res.status(500).json({
            code: 'SERVER_ITERNAL_ERR',
            error: config.env === 'dev' ? error : undefined
        });
    });

    app.listen(config.port, '0.0.0.0', () => {
        logger.info(`== Server launched on port ${config.port}. ==`);
    });
}

launch();

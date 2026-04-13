import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import config from './src/config/env.config.js';
import DB from './src/db/db.js';
import passportSetup from './src/config/passport.setup.js';
import logger from './src/utils/logger.js';

// Импорт роутов
import AuthRoutes from './src/routes/auth.routes.js';
import MockRoutes from './src/routes/mock.routes.js';
import AccountRoutes from './src/routes/account.router.js';

// Импорт middlewares
import sessionMiddleware from './src/middlewares/sessions.js';
import { errorHandler } from './src/middlewares/error.middleware.js';

const app = express();

// 1. ПОДКЛЮЧЕНИЕ К БД
DB.initialize()
    .then(() => logger.info('Database connected successfully'))
    .catch((err) => logger.error('Database connection error:', err));

// 2. БАЗОВЫЕ MIDDLEWARES
app.use(cors({
    origin: config.cors.origin, // Настроено в env.config.js (обычно http://localhost:3000)
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. СЕССИИ И PASSPORT
app.use(sessionMiddleware);
passportSetup(app); // Инициализация passport и стратегий

// 4. РОУТЫ
app.use('/auth', AuthRoutes);
app.use('/mocks', MockRoutes);
app.use('/account', AccountRoutes);

// 5. ОБРАБОТКА ОШИБОК (Обязательно ПОСЛЕ всех роутов)
app.use(errorHandler);

// ЗАПУСК СЕРВЕРА
const PORT = config.server.port || 5000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import pg from 'pg';
import config from '../config/env.config.js';


const PgSessionStore = pgSession(session);
const sessionPool = new pg.Pool({
    connectionString: config.db.url,
});

const sessions = session({
    store: new PgSessionStore({
        pool: sessionPool,
        tableName: 'sessions',
        createTableIfMissing: true
    }),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
});

export default sessions;

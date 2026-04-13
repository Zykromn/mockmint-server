import passport from 'passport';
import bcrypt from 'bcrypt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './env.config.js';
import DB from '../db/db.js';

const passportSetup = (app) => {
    app.use(passport.initialize());
    app.use(passport.session());

    const clientsRepo = DB.getRepository('Client');
    passport.serializeUser((client, next) => next(null, client.id));
    passport.deserializeUser(async (id, next) => {
        try {
            const client = await clientsRepo.findOneBy({ id });
            next(null, client);
        } catch (error) {
            next(error, null);
        }
    });

    // --- GOOGLE AUTH ---
    passport.use(new GoogleStrategy({
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl
    }, async (accessToken, refreshToken, profile, next) => {
        try {
            let client = await clientsRepo.findOneBy({ google_auth: profile.id });
            if (!client) {
                client = clientsRepo.create({
                    google_auth: profile.id,
                    email: profile.emails[0].value,
                    alias: profile.displayName, // ИСПРАВЛЕНО: name -> alias
                });
                await clientsRepo.save(client);
            } else {
                client.alias = profile.displayName; // ИСПРАВЛЕНО: name -> alias
                await clientsRepo.save(client);
            }
            return next(null, client);
        } catch (error) {
            return next(error); // ИСПРАВЛЕНО: throw error -> next(error)
        }
    }));

    // --- LOCAL AUTH ---
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, async (email, password, next) => {
        try {
            const user = await clientsRepo.findOneBy({ email });
            if (!user || !user.password) {
                // ИСПРАВЛЕНО: добавили код ошибки для роутера
                return next(null, false, { code: 'AUTH_SIGNIN_WRNGDATA' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return next(null, false, { code: 'AUTH_SIGNIN_WRNGDATA' });
            }

            return next(null, user);
        } catch (error) {
            return next(error); // ИСПРАВЛЕНО: throw error -> next(error)
        }
    }));
};

export default passportSetup;
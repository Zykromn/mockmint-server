import express from 'express';
import passport from 'passport';
import AuthController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { AuthValidator } from '../validators/auth.validator.js';

const AuthRoutes = express.Router();

AuthRoutes.post('/signup', validate(AuthValidator.signup), AuthController.signup);

AuthRoutes.post('/signin', validate(AuthValidator.signin), (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json(info);

        req.logIn(user, (err) => {
            if (err) return next(err);
            return AuthController.signin(req, res);
        });
    })(req, res, next);
});

AuthRoutes.get('/verify-email', validate(AuthValidator.verifyEmail, 'query'), AuthController.verifyEmail);
AuthRoutes.post('/forgot-password', validate(AuthValidator.forgotPassword), AuthController.forgotPassword);
AuthRoutes.post('/reset-password', validate(AuthValidator.resetPassword), AuthController.resetPassword);
AuthRoutes.post('/logout', AuthController.logout);

// Google OAuth
AuthRoutes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
AuthRoutes.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/dashboard')
);

export default AuthRoutes;
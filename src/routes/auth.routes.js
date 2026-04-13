import express from 'express';
import passport from 'passport';
import AuthController from './../controllers/auth.controller.js'


const AuthRoutes = express.Router();

AuthRoutes.post('/signup', AuthController.signup);
AuthRoutes.post('/signin', (req, res, next) => {
    // Добавляем третий параметр info
    passport.authenticate('local', (error, user, info) => {
        if (error) return next(error);
        if (!user) {
            // Отдаем JSON, который прилетел из стратегии (в нем уже лежит нужный code)
            return res.status(401).json(info);
        }
        req.logIn(user, (error) => {
            if (error) return next(error);
            return AuthController.signin(req, res);
        });
    })(req, res, next);
});

AuthRoutes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
AuthRoutes.get('/google/callback',
    passport.authenticate('google', { failureRedirect: 'https://mockmint.org/mocks' }),
    AuthController.googleCallback
);

AuthRoutes.get('/verify-email', AuthController.verifyEmail);

AuthRoutes.post('/logout', AuthController.logout);

AuthRoutes.post('/forgot-password', AuthController.forgotPassword);
AuthRoutes.post('/reset-password', AuthController.resetPassword);

export default AuthRoutes;
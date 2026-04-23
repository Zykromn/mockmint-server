import AuthService from '../services/auth.service.js';

class AuthController {
    async signup(req, res, next) {
        try {
            const { email, password, alias } = req.body;
            await AuthService.signup(email, password, alias);

            return res.status(201).json({ code: 'AUTH_SIGNUP_SUCCESS' });
        } catch (error) {
            next(error);
        }
    }

    async signin(req, res) {
        return res.status(200).json({
            code: 'AUTH_SIGNIN_SUCCESS',
            client: {
                email: req.user.email,
                alias: req.user.alias,
                sub_status: req.user.sub_status,
                sub_exp: req.user.sub_exp
            }
        });
    }

    async verifyEmail(req, res, next) {
        try {
            await AuthService.verifyEmail(req.query.token);
            return res.status(200).json({ code: 'AUTH_VERIFY_SUCCESS' });
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req, res, next) {
        try {
            await AuthService.forgotPassword(req.body.email);
            return res.status(200).json({ code: 'AUTH_FORGOT_SUCCESS' });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            await AuthService.resetPassword(req.body.token, req.body.password);
            return res.status(200).json({ code: 'AUTH_RESET_SUCCESS' });
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        req.logout((err) => {
            if (err) return next(err);
            req.session.destroy(() => {
                res.clearCookie('connect.sid');
                return res.status(200).json({ code: 'AUTH_LOGOUT_SUCCESS' });
            });
        });
    }
}

export default new AuthController();
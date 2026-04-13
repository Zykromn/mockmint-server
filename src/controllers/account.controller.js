import AccountService from '../services/account.service.js';

class AccountController {
    async get(req, res, next) {
        try {
            const client = await AccountService.getProfile(req.user?.id);
            res.status(200).json({ code: 'ACCOUNT_GET_SUCCESS', client });
        } catch (e) { next(e); }
    }
}

export default new AccountController();
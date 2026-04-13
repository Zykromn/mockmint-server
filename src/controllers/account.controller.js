class AccountController {

    // Эндпоинт GET /account/get
    static async get(req, res, next) {
        try {
            // Если сессии нет (или кука невалидна), Passport не создаст req.user
            if (!req.user || !req.user.id) {
                return res.status(401).json({ code: 'ACCOUNT_GET_AUTHREQ' });
            }

            // Возвращаем данные ровно по спецификации
            return res.status(200).json({
                code: 'ACCOUNT_GET_SUCCESS',
                client: {
                    client_id: req.user.id,
                    email: req.user.email,
                    alias: req.user.alias
                }
            });

        } catch (error) {
            return next(error);
        }
    }
}

export default AccountController;
import DB from '../db/db.js';
import { AppError } from '../utils/AppError.js';

class AccountService {
    constructor() {
        this.clientRepo = DB.getRepository('Client');
    }

    async getProfile(userId) {
        if (!userId) throw new AppError('ACCOUNT_GET_AUTHREQ', 401);

        const client = await this.clientRepo.findOneBy({ id: userId });
        if (!client) throw new AppError('ACCOUNT_NOT_FOUND', 404);

        return {
            client_id: client.id,
            email: client.email,
            alias: client.alias,
            sub_status: client.sub_status,
            sub_exp: client.sub_exp
        };
    }
}

export default new AccountService();
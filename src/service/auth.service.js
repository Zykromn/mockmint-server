import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import DB from '../db/db.js';
import Mailer from '../utils/mailer.js';
import { AppError } from '../utils/AppError.js';

class AuthService {
    constructor() {
        this.clientRepo = DB.getRepository('Client');
        this.tokenRepo = DB.getRepository('Token');
    }

    async signup(email, password, alias) {
        // 1. Проверка на существующий email
        const existingClient = await this.clientRepo.findOneBy({ email });
        if (existingClient) {
            throw new AppError('AUTH_SIGNUP_EMAILOCC', 400);
        }

        // 2. Хеширование и создание клиента
        const hashedPassword = await bcrypt.hash(password, 10);
        const client = this.clientRepo.create({
            email,
            password: hashedPassword,
            alias,
            is_verified: false
        });
        await this.clientRepo.save(client);

        // 3. Создание токена подтверждения (24 часа)
        const token = uuidv4();
        await this.tokenRepo.save(this.tokenRepo.create({
            client_id: client.id,
            token: token,
            type: 'verify_email',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }));

        // 4. Отправка письма (асинхронно)
        Mailer.sendVerificationEmail(email, alias, token).catch(() => {});

        return { email, alias };
    }

    async verifyEmail(token) {
        const tokenRecord = await this.tokenRepo.findOneBy({ token, type: 'verify_email' });

        if (!tokenRecord || new Date() > new Date(tokenRecord.expires_at)) {
            if (tokenRecord) await this.tokenRepo.remove(tokenRecord);
            throw new AppError('AUTH_VERIFY_INVALID', 400);
        }

        const client = await this.clientRepo.findOneBy({ id: tokenRecord.client_id });
        if (client) {
            client.is_verified = true;
            await this.clientRepo.save(client);
        }

        await this.tokenRepo.remove(tokenRecord);
        return true;
    }

    async forgotPassword(email) {
        const client = await this.clientRepo.findOneBy({ email });

        // В целях безопасности всегда отвечаем успехом, даже если email нет в базе
        if (!client) return true;

        const token = uuidv4();
        await this.tokenRepo.save(this.tokenRepo.create({
            client_id: client.id,
            token: token,
            type: 'reset_password',
            expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 час
        }));

        Mailer.sendPasswordResetEmail(email, client.alias, token).catch(() => {});
        return true;
    }

    async resetPassword(token, newPassword) {
        const tokenRecord = await this.tokenRepo.findOneBy({ token, type: 'reset_password' });

        if (!tokenRecord || new Date() > new Date(tokenRecord.expires_at)) {
            if (tokenRecord) await this.tokenRepo.remove(tokenRecord);
            throw new AppError('AUTH_RESET_INVALID', 400);
        }

        const client = await this.clientRepo.findOneBy({ id: tokenRecord.client_id });
        if (client) {
            client.password = await bcrypt.hash(newPassword, 10);
            await this.clientRepo.save(client);
        }

        await this.tokenRepo.remove(tokenRecord);
        return true;
    }
}

export default new AuthService();
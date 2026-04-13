import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import mailer from "../utils/mailer.js";
import DB from './../db/db.js';

class AuthController {
    static async signup(req, res, next) {
        try {
            const { email, password, alias } = req.body;
            if (!email || !password || !alias) {
                return res.status(400).json({ code: 'AUTH_SIGNUP_INVREQ' });
            }

            const clientsRepo = DB.getRepository('Client');
            if (await clientsRepo.findOneBy({ email })) {
                return res.status(400).json({ code: 'AUTH_SIGNUP_EMAILOCC' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // Создаем клиента (is_verified по умолчанию false)
            const client = clientsRepo.create({
                email: email,
                password: hashedPassword,
                alias: alias,
            });
            await clientsRepo.save(client);

            // Генерируем токен
            const tokenRepo = DB.getRepository('Token');
            const verifyToken = uuidv4();

            const tokenRecord = tokenRepo.create({
                client_id: client.id,
                token: verifyToken,
                type: 'verify_email',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Ровно 24 часа
            });
            await tokenRepo.save(tokenRecord);

            // Отправляем письмо (не блокируем ответ, если почта отвалится - юзер все равно зареган)
            mailer.sendVerificationEmail(client.email, client.alias, verifyToken).catch(err => {
                logger.error(`Failed to send email to ${client.email}, but user was created.`);
            });

            return res.status(201).json({ code: 'AUTH_SIGNUP_SUCCESS' });
        } catch (error) {
            return next(error);
        }
    }

    static async verifyEmail(req, res, next) {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(400).json({ code: 'AUTH_VERIFY_INVREQ' });
            }

            const tokenRepo = DB.getRepository('Token');
            const clientsRepo = DB.getRepository('Client');

            // Ищем токен
            const tokenRecord = await tokenRepo.findOneBy({ token, type: 'verify_email' });
            if (!tokenRecord) {
                return res.status(400).json({ code: 'AUTH_VERIFY_INVALID' });
            }

            // Проверяем срок годности
            if (new Date() > new Date(tokenRecord.expires_at)) {
                await tokenRepo.remove(tokenRecord); // Удаляем просроченный
                return res.status(400).json({ code: 'AUTH_VERIFY_EXPIRED' });
            }

            // Находим юзера и активируем
            const client = await clientsRepo.findOneBy({ id: tokenRecord.client_id });
            if (client) {
                client.is_verified = true;
                await clientsRepo.save(client);
            }

            // Одноразовый токен больше не нужен
            await tokenRepo.remove(tokenRecord);

            return res.status(200).json({ code: 'AUTH_VERIFY_SUCCESS' });
        } catch (error) {
            return next(error);
        }
    }

    static signin(req, res) {
        if (!req.user.is_verified) {
            return res.status(403).json({
                code: 'EMAIL_NOT_VERIFIED'
            });
        }
        return res.status(200).json({
            code: 'AUTH_SIGNIN_SUCCESS',
            client: {
                email: req.user.email,
                alias: req.user.alias,
                sub_status: req.user.sub_status,
                sub_exp: req.user.sub_exp,
            }
        });
    }

    static async googleCallback(req, res) {
        return res.redirect('http://localhost:3000/mocks');
    }

    static async logout(req, res, next) {
        req.logout((error) => {
            if (error) {
                return next(error);
            }

            req.session.destroy(() => {
                res.clearCookie('connect.sid');
                return res.status(200).json({ code: 'AUTH_LOGOUT_SUCCESS' });
            });
        });
    }

    static async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ code: 'AUTH_FORGOT_INVREQ' });
            }

            const clientsRepo = DB.getRepository('Client');
            const tokenRepo = DB.getRepository('Token');

            const client = await clientsRepo.findOneBy({ email });

            // ВАЖНО ДЛЯ БЕЗОПАСНОСТИ: Если юзер не найден, мы все равно отвечаем 200 OK.
            // Это защита от перебора email-адресов злоумышленниками.
            if (!client) {
                return res.status(200).json({ code: 'AUTH_FORGOT_SUCCESS' });
            }

            // Генерируем токен на 1 час
            const resetToken = uuidv4();
            const tokenRecord = tokenRepo.create({
                client_id: client.id,
                token: resetToken,
                type: 'reset_password',
                expires_at: new Date(Date.now() + 60 * 60 * 1000)
            });
            await tokenRepo.save(tokenRecord);

            mailer.sendPasswordResetEmail(client.email, client.alias, resetToken);

            return res.status(200).json({ code: 'AUTH_FORGOT_SUCCESS' });
        } catch (error) {
            return next(error);
        }
    }

    // Установка нового пароля по токену
    static async resetPassword(req, res, next) {
        try {
            const {token, password} = req.body;
            if (!token || !password) {
                return res.status(400).json({code: 'AUTH_RESET_INVREQ'});
            }

            const tokenRepo = DB.getRepository('Token');
            const clientsRepo = DB.getRepository('Client');

            // Ищем токен
            const tokenRecord = await tokenRepo.findOneBy({token, type: 'reset_password'});
            if (!tokenRecord) {
                return res.status(400).json({code: 'AUTH_RESET_INVALID'});
            }

            // Проверяем срок годности
            if (new Date() > new Date(tokenRecord.expires_at)) {
                await tokenRepo.remove(tokenRecord);
                return res.status(400).json({code: 'AUTH_RESET_EXPIRED'});
            }

            // Находим юзера и обновляем пароль
            const client = await clientsRepo.findOneBy({id: tokenRecord.client_id});
            if (client) {
                client.password = await bcrypt.hash(password, 10);
                await clientsRepo.save(client);
            }

            // Удаляем использованный токен
            await tokenRepo.remove(tokenRecord);

            return res.status(200).json({code: 'AUTH_RESET_SUCCESS'});
        } catch (error) {
            return next(error);
        }
    }
}

export default AuthController;
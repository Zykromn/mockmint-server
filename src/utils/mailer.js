import nodemailer from 'nodemailer';
import config from '../config/env.config.js';
import logger from './logger.js';

const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
    }
});

class Mailer {
    static async sendVerificationEmail(to, alias, token) {
        // Ссылка, по которой кликнет пользователь
        const link = `http://localhost:3000/verify-email?token=${token}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Привет, ${alias}!</h2>
                <p>Добро пожаловать в <b>MockMint</b> — платформу для генерации мок-экзаменов.</p>
                <p>Чтобы завершить регистрацию и получить доступ ко всем функциям, подтверди свою почту:</p>
                <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Подтвердить Email</a>
                <p style="margin-top: 30px; font-size: 12px; color: #888;">Эта ссылка действительна 24 часа. Если ты не регистрировался на MockMint, просто проигнорируй это письмо.</p>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: config.smtp.from,
                to: to,
                subject: 'Подтверждение регистрации | MockMint',
                html: html
            });
            logger.info(`Verification email sent to ${to}`);
        } catch (error) {
            logger.error(`SMTP Error sending email to ${to}:`, error);
            throw error;
        }
    }

    static async sendPasswordResetEmail(to, alias, token) {
        const link = `http://localhost:3000/reset-password?token=${token}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Привет, ${alias}!</h2>
                <p>Мы получили запрос на сброс пароля для твоего аккаунта в <b>MockMint</b>.</p>
                <p>Если это был ты, нажми на кнопку ниже, чтобы придумать новый пароль:</p>
                <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Сбросить пароль</a>
                <p style="margin-top: 30px; font-size: 12px; color: #888;">Эта ссылка действительна 1 час. Если ты не запрашивал сброс пароля, просто проигнорируй это письмо. Твой аккаунт в безопасности.</p>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: config.smtp.from,
                to: to,
                subject: 'Сброс пароля | MockMint',
                html: html
            });
            logger.info(`Password reset email sent to ${to}`);
        } catch (error) {
            logger.error(`SMTP Error sending reset email to ${to}:`, error);
            // Не прокидываем ошибку дальше, чтобы сервер не ответил 500
        }
    }
}

export default Mailer;
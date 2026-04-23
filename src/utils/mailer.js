import config from '../config/env.config.js';
import logger from './logger.js';

import nodemailer from 'nodemailer';


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
        const link = `${config.cors.origin}auth/verify-email?token=${token}`;

        const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 2rem auto;">
    <h2 style="color: #4a5dbe;">MockMint | Email verification</h2>
    <p>Welcome to <b>MockMint.org</b>.</p>
    <p>To complete the registration and access the service, please confirm your email address.</p>
    <a href="${link}" style="display: inline-block; padding: 1rem; background-color: #4a5dbe; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 1rem 0;">Verify Email</a>
    <p style="font-size: 1rem; color: #888;">This link is valid for 24 hours. If you have not registered on MockMint.org, please ignore this email.</p>
</div>
        `;

        try {
            await transporter.sendMail({
                from: config.smtp.from,
                to: to,
                subject: 'Email verification | MockMint.org',
                html: html
            });
        } catch (error) {
            logger.error(`SMTP Error sending email to ${to}:`, error);
            throw error;
        }
    }

    static async sendPasswordResetEmail(to, alias, token) {
        const link = `${config.cors.origin}reset-password?token=${token}`;

        const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 2rem auto;">
    <h2 style="color: #4a5dbe;">MockMint | Reset password</h2>
    <p>We have received a request to reset the password for your account for the MockMint.org.</p>
    <p><b>If you have sent the request, please click on the button below to reset the password. If you have not sent a request for password reset, please ignore this email.</b></p>
    <a href="${link}" style="display: inline-block; padding: 1rem; background-color: #4a5dbe; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 1rem 0;">Reset password</a>
    <p style="margin-top: 30px; font-size: 12px; color: #888;">This link is valid for 1 hour. If you have not registered on MockMint.org, please ignore this email.</p>
</div>
        `;

        try {
            await transporter.sendMail({
                from: config.smtp.from,
                to: to,
                subject: 'Reset password | MockMint.org',
                html: html
            });
        } catch (error) {
            logger.error(`SMTP Error sending reset email to ${to}:`, error);
        }
    }
}

export default Mailer;
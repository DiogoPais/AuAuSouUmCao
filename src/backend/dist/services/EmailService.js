"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Configurar o transporter para envio de emails
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com', // Exemplo para Gmail
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: true, // true para 465, false para outros
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendEmail = async (to, subject, text, html) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text, // O texto simples fica como plano B (fallback) caso o email do cliente não suporte HTML
        html: html || text, // Se passares HTML, ele usa o HTML!
    };
    console.log(`Enviando email para ${to} com assunto "${subject}" e texto "${text}"`);
    await transporter.sendMail(mailOptions);
};
exports.sendEmail = sendEmail;

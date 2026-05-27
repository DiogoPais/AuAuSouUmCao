import nodemailer from 'nodemailer';

// Configurar o transporter para envio de emails
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Vamos forçar o host aqui para garantir
  port: 587,              // 👈 Voltamos à porta 587
  secure: false,          // 👈 CRÍTICO: Tem de ser false para a porta 587!
  family: 4,              // 👈 Mantém-se para evitar aquele erro original do IPv6
  auth: {
    user: process.env.EMAIL_USER || '', 
    pass: process.env.EMAIL_PASS || '', 
  },
} as any);

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html: html || text,
  };
  console.log(`Enviando email para ${to} com assunto "${subject}" e texto "${text}"`);

  await transporter.sendMail(mailOptions);
};
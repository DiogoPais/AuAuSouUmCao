import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(express.json());

// Rota principal de verificação de saúde (Health Check)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', mensagem: 'Servidor AuAuSouUmCão a correr!' });
});

// Montar as rotas da nossa API
app.use('/api', apiRoutes);

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
});
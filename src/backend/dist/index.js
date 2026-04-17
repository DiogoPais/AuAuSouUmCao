"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
// Carregar variáveis de ambiente
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middlewares globais
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173', // Para quando testares no teu PC com o Vite
        'https://main.dgvaudjmhakvj.amplifyapp.com' // SUBSTITUI pelo teu link do Amplify!
    ],
    credentials: true
}));
app.use(express_1.default.json());
// Rota principal de verificação de saúde (Health Check)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', mensagem: 'Servidor AuAuSouUmCão a correr!' });
});
// Montar as rotas da nossa API
app.use('/api', api_1.default);
// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
});

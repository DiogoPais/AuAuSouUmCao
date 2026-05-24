"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
const path_1 = __importDefault(require("path"));
// ADICIONA ESTA LINHA:
const ReservaJobs_1 = require("./jobs/ReservaJobs");
const TarefasJobs_1 = require("./jobs/TarefasJobs");
const VeterinariaJobs_1 = require("./jobs/VeterinariaJobs");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'https://main.dgvaudjmhakvj.amplifyapp.com'
    ],
    credentials: true
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', mensagem: 'Servidor AuAuSouUmC o a correr!' });
});
app.use('/api', api_1.default);
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
    // ADICIONA ESTA LINHA: Acorda o trabalhador invis vel!
    (0, ReservaJobs_1.iniciarJobsDeReservas)();
    (0, TarefasJobs_1.iniciarJobsDeTarefas)();
    (0, VeterinariaJobs_1.iniciarJobsVeterinaria)();
});

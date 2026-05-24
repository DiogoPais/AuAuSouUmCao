import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import path from 'path';
// ADICIONA ESTA LINHA:
import { iniciarJobsDeReservas } from './jobs/ReservaJobs';
import { iniciarJobsDeTarefas } from './jobs/TarefasJobs';
import { iniciarJobsVeterinaria } from './jobs/VeterinariaJobs';

dotenv.config();
const app = express(); 
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://main.dgvaudjmhakvj.amplifyapp.com' 
  ],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', mensagem: 'Servidor AuAuSouUmC o a correr!' });
});

app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
    
    // ADICIONA ESTA LINHA: Acorda o trabalhador invis vel!
    iniciarJobsDeReservas();
    iniciarJobsDeTarefas();
    iniciarJobsVeterinaria();
});
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.iniciarJobsVeterinaria = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const iniciarJobsVeterinaria = () => {
    // Corre todos os dias às 00:00
    node_cron_1.default.schedule('0 0 * * *', async () => {
        console.log('[CRON JOB VET] A fazer reset aos checks diários dos animais...');
        try {
            await prisma.animal.updateMany({
                where: { check: true },
                data: { check: false }
            });
            console.log('[CRON JOB VET] Reset concluído com sucesso!');
        }
        catch (error) {
            console.error('[CRON JOB ERRO] Falha ao fazer reset:', error);
        }
    });
    console.log('🕒 Cron Job de Veterinária inicializado (Agendado para as 00:00).');
};
exports.iniciarJobsVeterinaria = iniciarJobsVeterinaria;

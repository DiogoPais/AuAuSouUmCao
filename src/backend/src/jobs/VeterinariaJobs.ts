import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const iniciarJobsVeterinaria = () => {
  // Corre todos os dias às 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON JOB VET] A fazer reset aos checks diários dos animais...');
    try {
      await prisma.animal.updateMany({
        where: { check: true },
        data: { check: false }
      });
      console.log('[CRON JOB VET] Reset concluído com sucesso!');
    } catch (error) {
      console.error('[CRON JOB ERRO] Falha ao fazer reset:', error);
    }
  });
  console.log('🕒 Cron Job de Veterinária inicializado (Agendado para as 00:00).');
};
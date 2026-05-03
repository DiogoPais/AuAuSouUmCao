import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const iniciarJobsDeReservas = () => {
  // Este cron job corre TODOS OS DIAS   MEIA-NOITE (00:00)
  // O padr o '0 0 * * *' significa: 0 minutos, 0 horas, todos os dias, todos os meses, todos os dias da semana
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON JOB] A iniciar limpeza de reservas caducadas...');
    
    try {
      // 1. Descobrir que dia  hoje (come ando   meia-noite para compara )
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // 2. Encontrar todas as reservas que:
      // - Est o "Pendentes" (o cliente nunca fez check-in)
      // - A data de entrada   inferior a hoje (ou seja, j  passou o dia em que ele devia ter chegado)
      const reservasCaducadas = await prisma.reserva.findMany({
        where: {
          estado: 'Pendente',
          dataEntrada: {
            lt: hoje // lt = less than (menor que)
          }
        }
      });

      if (reservasCaducadas.length === 0) {
        console.log('[CRON JOB] Nenhuma reserva caducada encontrada hoje.');
        return;
      }

      console.log(`[CRON JOB] Foram encontradas ${reservasCaducadas.length} reservas caducadas. A cancelar...`);

      // 3. Cancelar as reservas e libertar as boxes (o DAO j  trata de apagar os servi os associados se usarmos o update)
      for (const reserva of reservasCaducadas) {
        await prisma.reserva.update({
          where: { idReserva: reserva.idReserva },
          data: { estado: 'Cancelada' }
        });
        console.log(`[CRON JOB] Reserva ${reserva.idReserva} cancelada com sucesso.`);
      }

      console.log('[CRON JOB] Limpeza conclu da com sucesso!');
      
    } catch (error) {
      console.error('[CRON JOB ERRO FATAL] Falha ao processar a limpeza de reservas:', error);
    }
  });
  
  console.log(' Cron Job de Reservas inicializado.  espera da meia-noite...');
};
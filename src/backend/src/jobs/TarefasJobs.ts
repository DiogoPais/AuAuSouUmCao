import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const iniciarJobsDeTarefas = () => {
  // '59 23 * * *' = Correr todos os dias às 23:59 (1 minuto antes da meia-noite)
  cron.schedule('59 23 * * *', async () => {
    console.log('🧹 [CRON JOB TAREFAS] A iniciar a varredura noturna de tarefas perdidas...');

    const hoje = new Date();
    const fimDia = new Date(hoje.setHours(23, 59, 59, 999));

    try {
      // 1. Encontrar as tarefas que o Staff se esqueceu de fazer (ficaram Pendentes)
      const tarefasPerdidas = await prisma.servico.findMany({
        where: {
          estado: 'Pendente',
          data: { lte: fimDia }
        },
        include: { reserva: true }
      });

      if (tarefasPerdidas.length === 0) {
        console.log('[CRON JOB TAREFAS] A equipa do Staff fez o trabalho todo hoje! Nenhuma tarefa pendente.');
        return;
      }

      console.log(`[CRON JOB TAREFAS] Foram encontradas ${tarefasPerdidas.length} tarefas esquecidas. A processar...`);

      for (const tarefa of tarefasPerdidas) {
        // 2. Acertar o passo ao Staff: Marcar o serviço como "Falhado" (ou "NaoRealizado")
        // NOTA: Confirma que tens este estado (ex: 'Falhado') definido no teu ficheiro schema.prisma!
        await prisma.servico.update({
          where: { idServico: tarefa.idServico },
          data: { estado: 'Falhado' } 
        });

        // 3. Documentar a falha no Diário de Bordo para a Diana (Gestora) ver de manhã
        await prisma.diarioBordo.create({
          data: {
            descricao: `🚨 [FALHA DE STAFF] A tarefa de ${tarefa.tipo} agendada para hoje não foi realizada e expirou.`,
            reservaId: tarefa.reservaId
          }
        });

        // =========================================================
        // 4. REQUISITO CRÍTICO DE SAÚDE: Verificação de 2 refeições
        // =========================================================
        if (tarefa.tipo === 'Alimentacao') {
          // Vai procurar a ÚLTIMA refeição ANTERIOR a esta que o cão devia ter comido
          const refeicaoAnterior = await prisma.servico.findFirst({
            where: {
              reservaId: tarefa.reservaId,
              tipo: 'Alimentacao',
              data: { lt: tarefa.data } 
            },
            orderBy: { data: 'desc' }
          });

          // Se a refeição anterior a esta também já estiver com o estado 'Falhado'...
          if (refeicaoAnterior && refeicaoAnterior.estado === 'Falhado') {
            await prisma.diarioBordo.create({
              data: {
                descricao: `🆘 [ALERTA CRÍTICO DE SAÚDE] O animal falhou DUAS refeições consecutivas! Verificar o estado de saúde urgentemente.`,
                reservaId: tarefa.reservaId
              }
            });
            console.log(`🆘 [CRON JOB TAREFAS] ALERTA CRÍTICO: Animal da reserva ${tarefa.reservaId} sem comer há 2 refeições!`);
          }
        }
      }

      console.log('[CRON JOB TAREFAS] Limpeza de tarefas noturna concluída com sucesso!');
      
    } catch (error) {
      console.error('[CRON JOB ERRO FATAL] Falha ao processar as tarefas esquecidas:', error);
    }
  });

  console.log('🕒 Cron Job de Tarefas inicializado (Agendado para as 23:59).');
};
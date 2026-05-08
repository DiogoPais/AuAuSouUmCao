import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PrescricaoDAO {
  // Busca o primeiro funcionário Vet da BD
  async buscarPrimeiroFuncionarioVet() {
    return await prisma.funcionario.findFirst({
      where: { perfil: 'Vet' }
    });
  }

  // 1. O NOVO CREATE (Agora guarda o totalDoses)
  async create(dados: any) {
    return await prisma.prescricao.create({
      data: {
        data: new Date(),
        animalId: dados.animalId,
        funcionarioId: dados.funcionarioId,
        linhas: {
          create: dados.linhas.map((linha: any) => ({
            dosagem: linha.dosagem,
            frequencia: linha.frequencia,
            totalDoses: linha.totalDoses, // <--- ADICIONADO
            medicamentoId: linha.medicamentoId
          }))
        }
      },
      include: { linhas: true } 
    });
  }

  // 2. PUXAR TRATAMENTOS ATIVOS (Sem o 'take: 1' para contar o histórico completo)
  async listarTratamentosAtivos() {
    return await prisma.linhaPrescricao.findMany({
      where: { ativa: true },
      include: {
        medicamento: { include: { stock: true } },
        prescricao: { 
          include: { 
            animal: true, 
            funcionario: { include: { utilizador: true } } 
          } 
        },
        logsAdministracao: {
          orderBy: { timestamp: 'desc' } // Trazemos TODOS os logs para fazer a barra de progresso
        }
      },
      orderBy: { prescricao: { data: 'desc' } }
    });
  }

  // 3. REGISTAR TOMA E VERIFICAR FIM DO TRATAMENTO
  async registarAdministracao(idLinha: string, idUtilizadorFrontEnd: string) {
    const funcionario = await prisma.funcionario.findUnique({
      where: { utilizadorId: idUtilizadorFrontEnd }
    });

    if (!funcionario) throw new Error("Não foi possível encontrar o perfil de Funcionário.");

    // Regista a toma
    const log = await prisma.logMedicacao.create({
      data: {
        linhaId: idLinha,
        funcionarioId: funcionario.idFuncionario
      }
    });

    // Puxa o histórico atualizado
    const linha = await prisma.linhaPrescricao.findUnique({
      where: { idLinha },
      include: { logsAdministracao: true }
    });

    // MAGIA: Se os logs chegarem ou passarem o total de doses, desativa a linha!
    if (linha && linha.logsAdministracao.length >= linha.totalDoses) {
      await prisma.linhaPrescricao.update({
        where: { idLinha },
        data: { ativa: false }
      });
    }

    return log;
  }

  async findByAnimal(animalId: string) {
    return await prisma.prescricao.findMany({ 
      where: { animalId },
      include: { 
        linhas: { 
          include: { 
            medicamento: { 
              include: { stock: true } 
            } 
          } 
        },
        funcionario: {
          include: { utilizador: true }
        },
        animal: true
      },
      orderBy: { data: 'desc' }
    });
  }

  // A MÁGICA DO BOOLEANO: Lista cães hospedados que ainda não têm o "check" feito hoje
  async listarCaesParaVerificar() {
    return await prisma.animal.findMany({
      where: {
        check: false, // Usa o teu novo atributo de forma super otimizada!
        reservas: {
          some: { estado: 'CheckIn' } // Só puxa os cães que já deram entrada no hotel
        }
      },
      include: {
        tutor: { include: { utilizador: true } },
        reservas: {
          where: { estado: 'CheckIn' },
          include: { box: true }
        }
      }
    });
  }

  // Regista um check diário da veterinária
  async registarCheckDiario(idAnimal: string, notas: string) {
    // 1. Muda o boolean para true para desaparecer da lista de verificações
    await prisma.animal.update({
      where: { idAnimal },
      data: { check: true }
    });

    // 2. CRIA um novo registo no diário de bordo com as notas
    return await prisma.diarioBordo.create({
      data: {
        descricao: `[CHECK VETERINÁRIO] ${notas}`,
        animalId: idAnimal
      }
    });
  }

  async ativarQuarentena(idAnimal: string, motivo: string) {
    // 1. Muda o estado clínico
    const animalAtualizado = await prisma.animal.update({
      where: { idAnimal },
      data: { estado: 'Quarentena' }
    });

    // 2. PROTOCOLO DE ISOLAMENTO: Realocar a reserva ativa para uma Box de Quarentena
    const reservaAtiva = await prisma.reserva.findFirst({
      where: { animalId: idAnimal, estado: 'CheckIn' },
      include: { box: true }
    });

    if (reservaAtiva && reservaAtiva.box.tipo !== 'Quarentena') {
      // Procura uma box de Quarentena Limpa e Vazia
      const boxQuarentena = await prisma.box.findFirst({
        where: { tipo: 'Quarentena', estado: 'Limpa' },
        orderBy: { numero: 'asc' }
      });

      if (boxQuarentena) {
        // Suja a Box antiga onde o cão infetado esteve
        await prisma.box.update({
          where: { numero: reservaAtiva.boxNumero },
          data: { estado: 'Suja' }
        });

        // Transfere o cão e marca a nova box como "Ocupada" pela Quarentena
        await prisma.reserva.update({
          where: { idReserva: reservaAtiva.idReserva },
          data: { boxNumero: boxQuarentena.numero }
        });

        await prisma.box.update({
          where: { numero: boxQuarentena.numero },
          data: { estado: 'Ocupada' }
        });
      }
    }

    // 3. Regista o alerta
    await prisma.diarioBordo.create({
      data: {
        descricao: `🚨 [QUARENTENA] ${motivo}. Protocolo de Isolamento ativado.`,
        animalId: idAnimal
      }
    });

    return animalAtualizado;
  }

  // Desativa quarentena
  async desativarQuarentena(idAnimal: string) {
    const animalAtualizado = await prisma.animal.update({
      where: { idAnimal },
      data: { estado: 'Saudavel' }
    });

    // Regista a alta no diário
    await prisma.diarioBordo.create({
      data: {
        descricao: `✅ [ALTA MÉDICA] O animal foi retirado da quarentena.`,
        animalId: idAnimal
      }
    });

    return animalAtualizado;
  }

  // Lista cães em quarentena
  async listarEmQuarentena() {
    return await prisma.animal.findMany({
      where: { estado: 'Quarentena' },
      include: {
        tutor: { include: { utilizador: true } },
        diarioBordo: { orderBy: { timestamp: 'desc' }, take: 5 }
      }
    });
  }

  // Verifica se um animal já foi verificado hoje
  async verificarSeJaFoiCheckHoje(idAnimal: string) {
    const animal = await prisma.animal.findUnique({
      where: { idAnimal },
      select: { check: true }
    });
    return animal?.check ?? false;
  }

  async finalizarTratamento(idLinha: string) {
    return await prisma.linhaPrescricao.update({
      where: { idLinha },
      data: { ativa: false }
    });
  }
}
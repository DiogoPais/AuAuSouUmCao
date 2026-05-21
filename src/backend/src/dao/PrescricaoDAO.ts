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
            totalDoses: linha.totalDoses,
            medicamentoId: linha.medicamentoId
          }))
        }
      },
      include: { linhas: true } 
    });
  }

  // 2. PUXAR TRATAMENTOS ATIVOS 
  async listarTratamentosAtivos() {
    return await prisma.linhaPrescricao.findMany({
      where: { 
        ativa: true,
        prescricao: {
          animal: {
            reservas: {
              some: { estado: 'CheckIn' }
            }
          }
        }
      },
      include: {
        medicamento: { include: { stock: true } },
        prescricao: { 
          include: { 
            animal: true, 
            funcionario: { include: { utilizador: true } } 
          } 
        },
        logsAdministracao: {
          orderBy: { timestamp: 'desc' }
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

    const log = await prisma.logMedicacao.create({
      data: {
        linhaId: idLinha,
        funcionarioId: funcionario.idFuncionario
      }
    });

    const linha = await prisma.linhaPrescricao.findUnique({
      where: { idLinha },
      include: { logsAdministracao: true }
    });

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

  // Lista cães hospedados que ainda não têm o "check" feito hoje
  async listarCaesParaVerificar() {
    return await prisma.animal.findMany({
      where: {
        check: false, 
        reservas: {
          some: { estado: 'CheckIn' } 
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

  // 👇 ATUALIZADO: Regista o check diário (associado à Reserva!)
  async registarCheckDiario(idAnimal: string, notas: string, nomeVet: string) {
    await prisma.animal.update({ where: { idAnimal }, data: { check: true } });

    const reservaAtiva = await prisma.reserva.findFirst({
      where: { animalId: idAnimal, estado: 'CheckIn' }
    });

    if (reservaAtiva) {
      return await prisma.diarioBordo.create({
        data: {
          descricao: `[CHECK CLÍNICO por ${nomeVet}] ${notas}`,
          reservaId: reservaAtiva.idReserva // 👈 MUDADO DE animalId PARA reservaId
        }
      });
    }
    return null;
  }

  // 👇 ATUALIZADO: Ativar quarentena e criar log (associado à Reserva!)
  async ativarQuarentena(idAnimal: string, motivo: string) {
    const animalAtualizado = await prisma.animal.update({
      where: { idAnimal },
      data: { estado: 'Quarentena' }
    });

    const reservaAtiva = await prisma.reserva.findFirst({
      where: { animalId: idAnimal, estado: 'CheckIn' },
      include: { box: true }
    });

    if (reservaAtiva) {
      if (reservaAtiva.box.tipo !== 'Quarentena') {
        const boxQuarentena = await prisma.box.findFirst({
          where: { tipo: 'Quarentena', estado: 'Limpa' },
          orderBy: { numero: 'asc' }
        });

        if (boxQuarentena) {
          await prisma.box.update({
            where: { numero: reservaAtiva.boxNumero },
            data: { estado: 'Suja' }
          });

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

      // 👈 MUDADO DE animalId PARA reservaId
      await prisma.diarioBordo.create({
        data: {
          descricao: `🚨 [QUARENTENA] ${motivo}. Protocolo de Isolamento ativado.`,
          reservaId: reservaAtiva.idReserva 
        }
      });
    }

    return animalAtualizado;
  }

  // 👇 ATUALIZADO: Desativar quarentena e criar log (associado à Reserva!)
  async desativarQuarentena(idAnimal: string) {
    const animalAtualizado = await prisma.animal.update({
      where: { idAnimal },
      data: { estado: 'Saudavel' }
    });

    const reservaAtiva = await prisma.reserva.findFirst({
      where: { animalId: idAnimal, estado: 'CheckIn' },
      include: { box: true }
    });

    if (reservaAtiva) {
      if (reservaAtiva.box.tipo === 'Quarentena') {
        const boxNormal = await prisma.box.findFirst({
          where: { 
            tipo: { not: 'Quarentena' }, 
            estado: 'Limpa' 
          },
          orderBy: { numero: 'asc' }
        });

        if (boxNormal) {
          await prisma.box.update({
            where: { numero: reservaAtiva.boxNumero },
            data: { estado: 'Suja' }
          });

          await prisma.reserva.update({
            where: { idReserva: reservaAtiva.idReserva },
            data: { boxNumero: boxNormal.numero }
          });

          await prisma.box.update({
            where: { numero: boxNormal.numero },
            data: { estado: 'Ocupada' }
          });
        }
      }

      // 👈 MUDADO DE animalId PARA reservaId
      await prisma.diarioBordo.create({
        data: {
          descricao: `✅ [ALTA MÉDICA] O animal teve alta e foi transferido da quarentena de volta para a ala normal.`,
          reservaId: reservaAtiva.idReserva
        }
      });
    }

    return animalAtualizado;
  }

  // Lista cães em quarentena
  async listarEmQuarentena() {
    return await prisma.animal.findMany({
      where: { 
        estado: 'Quarentena',
        reservas: {
          some: { estado: 'CheckIn' }
        }
      },
      include: {
        tutor: { include: { utilizador: true } },
        // 👇 ATUALIZADO: Buscar diário através das reservas em vez de diretamente no animal
        reservas: {
          where: { estado: 'CheckIn' },
          include: { 
            box: true,
            diarioBordo: { orderBy: { timestamp: 'desc' }, take: 5 }
          }
        }
      }
    });
  }

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
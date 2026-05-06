import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PrescricaoDAO {
  // O NOVO CREATE: Agora suporta a tabela LinhaPrescricao
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
            medicamentoId: linha.medicamentoId
          }))
        }
      },
      include: { linhas: true } // Devolve as linhas para a Facade descontar o stock
    });
  }

  async findByAnimal(animalId: string) {
    return await prisma.prescricao.findMany({ 
      where: { animalId },
      include: { linhas: { include: { medicamento: { include: { stock: true } } } } } 
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

  // Ativa quarentena para um animal
  async ativarQuarentena(idAnimal: string, motivo: string) {
    const animalAtualizado = await prisma.animal.update({
      where: { idAnimal },
      data: { estado: 'Quarentena' }
    });

    // Regista o alerta no diário
    await prisma.diarioBordo.create({
      data: {
        descricao: `🚨 [QUARENTENA] ${motivo}`,
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
}
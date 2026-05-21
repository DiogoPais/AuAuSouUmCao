import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnimalDAO {

  // Vai buscar todos os animais (usado pela Receção)
  async findAll() {
    return await prisma.animal.findMany({
      include: { planoVacinal: true }
    });
  }

  // Vai buscar apenas os animais de um Tutor específico
  async findByTutorNif(nif: string) {
    return await prisma.animal.findMany({
      where: { tutorNif: nif },
      include: { planoVacinal: true }
    });
  }

  // Encontra um animal pelo ID e traz o seu Diário de Bordo (através da reserva ativa)
  async findByIdWithHistorial(idAnimal: string) {
    return await prisma.animal.findUnique({
      where: { idAnimal: idAnimal },
      include: {
        reservas: {
          where: { estado: 'CheckIn' },
          include: {
            diarioBordo: {
              orderBy: { timestamp: 'desc' }
            }
          }
        }
      }
    });
  }

  // Cria um novo animal na Base de Dados
  async createAnimal(dadosAnimal: any, dadosVacina?: any) {
    return await prisma.animal.create({
      data: {
        ...dadosAnimal,
        planoVacinal: dadosVacina ? { create: dadosVacina } : undefined
      }
    });
  }

  // Busca os detalhes e logs para apresentar ao Tutor / Staff
  async animalDiario(idAnimal: string) {
    const animal = await prisma.animal.findUnique({
      where: { idAnimal }
    });

    if (!animal) {
      return { error: 'Animal não encontrado na base de dados.' };
    }

    // Procura a reserva ATIVA do animal para ir buscar os registos dessa estadia
    const reservaAtiva = await prisma.reserva.findFirst({
      where: { animalId: idAnimal, estado: 'CheckIn' },
      include: {
        servicos: {
          orderBy: { data: 'asc' }
        },
        diarioBordo: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    return {
      idAnimal: animal.idAnimal,
      nome: animal.nome,
      estadoClinico: animal.estado,
      // Se tiver reserva ativa mapeia os logs, se não, devolve array vazio
      diarioBordo: reservaAtiva?.diarioBordo.map((registo) => ({
        idRegisto: registo.idRegisto,
        timestamp: registo.timestamp,
        dataHora: registo.timestamp, // Mantido para compatibilidade com Frontend
        descricao: registo.descricao,
        fotos: registo.fotos,
        fotoUrl: registo.fotos[0] || '' // Mantido para compatibilidade com Frontend
      })) || [],
      servicos: reservaAtiva?.servicos || []
    };
  }

  // Atualiza o plano vacinal de um animal
  async updatePlanoVacinal(idAnimal: string, dadosVacina: any) {
    // Primeiro verifica se o animal existe
    const animal = await prisma.animal.findUnique({
      where: { idAnimal },
      include: { planoVacinal: true }
    });

    if (!animal) {
      throw new Error(`Animal com ID ${idAnimal} não encontrado.`);
    }

    // Se já tem plano vacinal, atualiza. Se não, cria.
    if (animal.planoVacinal) {
      return await prisma.planoVacinal.update({
        where: { idPlano: animal.planoVacinal.idPlano },
        data: dadosVacina
      });
    } else {
      return await prisma.planoVacinal.create({
        data: {
          ...dadosVacina,
          animalId: idAnimal
        }
      });
    }
  }

  // Busca o historial completo do animal (diário + servicos) adaptado à nova BD
  async findHistorialComDados(idAnimal: string) {
    const animal = await prisma.animal.findUnique({
      where: { idAnimal }
    });

    if (!animal) {
      throw new Error(`Animal com ID ${idAnimal} não encontrado.`);
    }

    const reservaAtiva = await prisma.reserva.findFirst({
      where: { animalId: idAnimal, estado: 'CheckIn' },
      include: {
        diarioBordo: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    return {
      idAnimal: animal.idAnimal,
      nome: animal.nome,
      raca: animal.raca,
      reatividade: animal.reatividade,
      estadoClinico: animal.estado,
      diarioBordo: reservaAtiva?.diarioBordo.map(d => ({
        idRegisto: d.idRegisto,
        dataHora: d.timestamp,
        timestamp: d.timestamp,
        descricao: d.descricao,
        fotos: d.fotos
      })) || []
    };
  }
}
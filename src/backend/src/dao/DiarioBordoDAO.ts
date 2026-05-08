import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DiarioBordoDAO {
  async create(descricao: string, animalId: string, fotos: string[] = []) {
    return await prisma.diarioBordo.create({
      data: {
        descricao,
        animalId,
        fotos
      }
    });
  }
// Busca todo o histórico de acontecimentos no hotel
  async findAll() {
    return await prisma.diarioBordo.findMany({
      include: { animal: true },
      orderBy: { timestamp: 'desc' }
    });
  }
  
}
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FaturaDAO {
  async create(dadosFatura: { nifCliente: string, valorTotal: number, documento: string, metodoPagamento: string }) {
    return await prisma.faturas.create({
      data: dadosFatura
    });
  }
// Busca todas as faturas para o Dashboard da Gestora
  async findAll() {
    return await prisma.faturas.findMany({
      orderBy: { idFaturas: 'desc' } // Mostra as mais recentes primeiro
    });
  }
}
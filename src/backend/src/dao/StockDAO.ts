import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StockDAO {
  async findAll() {
    // Incluímos a Racao e o Medicamento para o Frontend poder separar os tipos
    return await prisma.stock.findMany({ 
      include: { medicamento: true, racao: true } 
    });
  }

  async updateQuantidade(idItem: string, novaQuantidade: number) {
    return await prisma.stock.update({
      where: { idItem },
      data: { quantidade: novaQuantidade }
    });
  }

  async findMedicamentoComStock(idMedicamento: string) {
    return await prisma.medicamento.findUnique({
      where: { idMedicamento },
      include: { stock: true }
    });
  }
}
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LogsDAO {
  async createLog(linhaId: string, funcionarioId: string) {
    return await prisma.logMedicacao.create({
      data: {
        linhaId,
        funcionarioId
      }
    });
  }
}
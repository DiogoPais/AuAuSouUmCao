-- AlterEnum
ALTER TYPE "TipoServico" ADD VALUE 'Alimentacao';

-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "doseDiaria" DOUBLE PRECISION,
ADD COLUMN     "racaoId" TEXT,
ADD COLUMN     "tipoTrela" TEXT DEFAULT 'Normal';

-- AlterTable
ALTER TABLE "Servico" ADD COLUMN     "funcionarioId" TEXT;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("idFuncionario") ON DELETE SET NULL ON UPDATE CASCADE;

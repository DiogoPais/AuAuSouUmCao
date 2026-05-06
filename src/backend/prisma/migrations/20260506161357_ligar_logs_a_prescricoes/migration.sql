/*
  Warnings:

  - Added the required column `linhaId` to the `LogMedicacao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LinhaPrescricao" ADD COLUMN     "ativa" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "LogMedicacao" ADD COLUMN     "linhaId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "LogMedicacao" ADD CONSTRAINT "LogMedicacao_linhaId_fkey" FOREIGN KEY ("linhaId") REFERENCES "LinhaPrescricao"("idLinha") ON DELETE CASCADE ON UPDATE CASCADE;

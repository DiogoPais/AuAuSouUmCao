/*
  Warnings:

  - You are about to drop the column `dosagem` on the `Prescricao` table. All the data in the column will be lost.
  - You are about to drop the column `frequencia` on the `Prescricao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Prescricao" DROP COLUMN "dosagem",
DROP COLUMN "frequencia";

-- AlterTable
ALTER TABLE "Servico" ADD COLUMN     "descricao" TEXT;

-- CreateTable
CREATE TABLE "Racao" (
    "idRacao" TEXT NOT NULL,
    "marca" TEXT,
    "stockId" TEXT NOT NULL,

    CONSTRAINT "Racao_pkey" PRIMARY KEY ("idRacao")
);

-- CreateTable
CREATE TABLE "LinhaPrescricao" (
    "idLinha" TEXT NOT NULL,
    "dosagem" DOUBLE PRECISION NOT NULL,
    "frequencia" TEXT NOT NULL,
    "prescricaoId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,

    CONSTRAINT "LinhaPrescricao_pkey" PRIMARY KEY ("idLinha")
);

-- CreateIndex
CREATE UNIQUE INDEX "Racao_stockId_key" ON "Racao"("stockId");

-- AddForeignKey
ALTER TABLE "Racao" ADD CONSTRAINT "Racao_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("idItem") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinhaPrescricao" ADD CONSTRAINT "LinhaPrescricao_prescricaoId_fkey" FOREIGN KEY ("prescricaoId") REFERENCES "Prescricao"("idPrescricao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinhaPrescricao" ADD CONSTRAINT "LinhaPrescricao_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("idMedicamento") ON DELETE RESTRICT ON UPDATE CASCADE;

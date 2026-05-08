/*
  Warnings:

  - You are about to drop the column `ocupacao` on the `Box` table. All the data in the column will be lost.
  - You are about to drop the column `tamanho` on the `Box` table. All the data in the column will be lost.
  - The `estado` column on the `Box` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Box" DROP COLUMN "ocupacao",
DROP COLUMN "tamanho",
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'Não-Reativo',
DROP COLUMN "estado",
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'Limpa';

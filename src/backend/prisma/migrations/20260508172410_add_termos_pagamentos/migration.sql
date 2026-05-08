-- AlterTable
ALTER TABLE "Faturas" ADD COLUMN     "metodoPagamento" TEXT NOT NULL DEFAULT 'Não Definido';

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "termoAceite" BOOLEAN NOT NULL DEFAULT false;

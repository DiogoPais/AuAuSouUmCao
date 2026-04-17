-- CreateEnum
CREATE TYPE "TipoPerfil" AS ENUM ('Admin', 'Vet', 'Staff');

-- CreateEnum
CREATE TYPE "EstadoVacina" AS ENUM ('Valido', 'Caducado');

-- CreateEnum
CREATE TYPE "EstadoClinico" AS ENUM ('Saudavel', 'Quarentena');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('Pendente', 'CheckIn', 'CheckOut', 'Cancelada');

-- CreateEnum
CREATE TYPE "EstadoBox" AS ENUM ('Suja', 'Higienizada');

-- CreateEnum
CREATE TYPE "TipoServico" AS ENUM ('Grooming', 'Passeio', 'Adestramento');

-- CreateTable
CREATE TABLE "Utilizador" (
    "idUtilizador" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Utilizador_pkey" PRIMARY KEY ("idUtilizador")
);

-- CreateTable
CREATE TABLE "Tutor" (
    "nif" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("nif")
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "idFuncionario" TEXT NOT NULL,
    "perfil" "TipoPerfil" NOT NULL,
    "utilizadorId" TEXT NOT NULL,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("idFuncionario")
);

-- CreateTable
CREATE TABLE "Animal" (
    "idAnimal" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "raca" TEXT,
    "reatividade" TEXT NOT NULL,
    "microchip" TEXT NOT NULL,
    "estado" "EstadoClinico" NOT NULL DEFAULT 'Saudavel',
    "tutorNif" TEXT NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("idAnimal")
);

-- CreateTable
CREATE TABLE "PlanoVacinal" (
    "idPlano" TEXT NOT NULL,
    "dataUltimaVacina" TIMESTAMP(3) NOT NULL,
    "documento" TEXT NOT NULL,
    "isValido" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoVacina" NOT NULL,
    "animalId" TEXT NOT NULL,

    CONSTRAINT "PlanoVacinal_pkey" PRIMARY KEY ("idPlano")
);

-- CreateTable
CREATE TABLE "Box" (
    "numero" INTEGER NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "ocupacao" INTEGER NOT NULL,
    "estado" "EstadoBox" NOT NULL DEFAULT 'Higienizada',

    CONSTRAINT "Box_pkey" PRIMARY KEY ("numero")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "idReserva" TEXT NOT NULL,
    "dataEntrada" TIMESTAMP(3) NOT NULL,
    "dataSaida" TIMESTAMP(3) NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'Pendente',
    "animalId" TEXT NOT NULL,
    "boxNumero" INTEGER NOT NULL,
    "faturaId" TEXT,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("idReserva")
);

-- CreateTable
CREATE TABLE "Servico" (
    "idServico" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "tipo" "TipoServico" NOT NULL,
    "reservaId" TEXT NOT NULL,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("idServico")
);

-- CreateTable
CREATE TABLE "Faturas" (
    "idFaturas" TEXT NOT NULL,
    "nifCliente" TEXT NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "documento" TEXT NOT NULL,

    CONSTRAINT "Faturas_pkey" PRIMARY KEY ("idFaturas")
);

-- CreateTable
CREATE TABLE "DiarioBordo" (
    "idRegisto" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fotos" TEXT[],
    "animalId" TEXT NOT NULL,

    CONSTRAINT "DiarioBordo_pkey" PRIMARY KEY ("idRegisto")
);

-- CreateTable
CREATE TABLE "Stock" (
    "idItem" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "limiteAlerta" INTEGER NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("idItem")
);

-- CreateTable
CREATE TABLE "Medicamento" (
    "idMedicamento" TEXT NOT NULL,
    "concentracao" DOUBLE PRECISION NOT NULL,
    "stockId" TEXT NOT NULL,

    CONSTRAINT "Medicamento_pkey" PRIMARY KEY ("idMedicamento")
);

-- CreateTable
CREATE TABLE "Prescricao" (
    "idPrescricao" TEXT NOT NULL,
    "dosagem" DOUBLE PRECISION NOT NULL,
    "frequencia" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "animalId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,

    CONSTRAINT "Prescricao_pkey" PRIMARY KEY ("idPrescricao")
);

-- CreateTable
CREATE TABLE "LogMedicacao" (
    "idLog" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "funcionarioId" TEXT NOT NULL,

    CONSTRAINT "LogMedicacao_pkey" PRIMARY KEY ("idLog")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilizador_email_key" ON "Utilizador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_utilizadorId_key" ON "Tutor"("utilizadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_utilizadorId_key" ON "Funcionario"("utilizadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Animal_microchip_key" ON "Animal"("microchip");

-- CreateIndex
CREATE UNIQUE INDEX "PlanoVacinal_animalId_key" ON "PlanoVacinal"("animalId");

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_faturaId_key" ON "Reserva"("faturaId");

-- CreateIndex
CREATE UNIQUE INDEX "Medicamento_stockId_key" ON "Medicamento"("stockId");

-- AddForeignKey
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("idUtilizador") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("idUtilizador") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_tutorNif_fkey" FOREIGN KEY ("tutorNif") REFERENCES "Tutor"("nif") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoVacinal" ADD CONSTRAINT "PlanoVacinal_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("idAnimal") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("idAnimal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_boxNumero_fkey" FOREIGN KEY ("boxNumero") REFERENCES "Box"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Faturas"("idFaturas") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("idReserva") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiarioBordo" ADD CONSTRAINT "DiarioBordo_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("idAnimal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicamento" ADD CONSTRAINT "Medicamento_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("idItem") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescricao" ADD CONSTRAINT "Prescricao_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("idAnimal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescricao" ADD CONSTRAINT "Prescricao_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("idFuncionario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogMedicacao" ADD CONSTRAINT "LogMedicacao_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("idFuncionario") ON DELETE RESTRICT ON UPDATE CASCADE;

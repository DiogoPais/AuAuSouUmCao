"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockDAO = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class StockDAO {
    async findAll() {
        // Incluímos a Racao e o Medicamento para o Frontend poder separar os tipos
        return await prisma.stock.findMany({
            include: { medicamento: true, racao: true }
        });
    }
    async updateQuantidade(idItem, novaQuantidade) {
        return await prisma.stock.update({
            where: { idItem },
            data: { quantidade: novaQuantidade }
        });
    }
    async findMedicamentoComStock(idMedicamento) {
        return await prisma.medicamento.findUnique({
            where: { idMedicamento },
            include: { stock: true }
        });
    }
    async findItemPorNome(nome) {
        return await prisma.stock.findFirst({
            where: { nome: nome },
            include: { medicamento: true }
        });
    }
    // 👇 NOVA FUNÇÃO ADICIONADA PARA O ALGORITMO DA RAÇÃO 👇
    async findById(idItem) {
        return await prisma.stock.findUnique({
            where: { idItem: idItem }
        });
    }
}
exports.StockDAO = StockDAO;

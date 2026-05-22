"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaturaDAO = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class FaturaDAO {
    async create(dadosFatura) {
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
    async buscarPorTutor(nif) {
        return await prisma.faturas.findMany({
            where: { nifCliente: nif },
            orderBy: { idFaturas: 'desc' }
        });
    }
}
exports.FaturaDAO = FaturaDAO;

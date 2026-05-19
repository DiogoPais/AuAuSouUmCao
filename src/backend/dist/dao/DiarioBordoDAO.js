"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiarioBordoDAO = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class DiarioBordoDAO {
    async create(descricao, animalId, fotos = []) {
        return await prisma.diarioBordo.create({
            data: {
                descricao,
                animalId,
                fotos
            }
        });
    }
    // Busca todo o histórico de acontecimentos no hotel
    async findAll() {
        return await prisma.diarioBordo.findMany({
            include: { animal: true },
            orderBy: { timestamp: 'desc' }
        });
    }
}
exports.DiarioBordoDAO = DiarioBordoDAO;

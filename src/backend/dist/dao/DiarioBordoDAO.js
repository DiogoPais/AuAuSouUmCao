"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiarioBordoDAO = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class DiarioBordoDAO {
    async create(descricao, animalId, fotos = []) {
        // 1. Primeiro vamos descobrir qual é a estadia (reserva) atual do cão
        const reservaAtiva = await prisma.reserva.findFirst({
            where: { animalId: animalId, estado: 'CheckIn' }
        });
        // Se o cão não estiver no hotel, o sistema bloqueia a criação de logs fantasma
        if (!reservaAtiva) {
            throw new Error('Não é possível adicionar registos: O animal não está hospedado no momento.');
        }
        // 2. Cria o log ligado à reserva correta!
        return await prisma.diarioBordo.create({
            data: {
                descricao,
                reservaId: reservaAtiva.idReserva,
                fotos
            }
        });
    }
    // Busca todo o histórico de acontecimentos no hotel
    async findAll() {
        return await prisma.diarioBordo.findMany({
            // O include foi atualizado para passar pela reserva antes de chegar ao animal
            include: {
                reserva: {
                    include: {
                        animal: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' }
        });
    }
}
exports.DiarioBordoDAO = DiarioBordoDAO;

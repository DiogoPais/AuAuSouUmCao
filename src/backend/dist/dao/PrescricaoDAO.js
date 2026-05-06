"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescricaoDAO = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PrescricaoDAO {
    // Busca o primeiro funcionário Vet da BD
    async buscarPrimeiroFuncionarioVet() {
        return await prisma.funcionario.findFirst({
            where: { perfil: 'Vet' }
        });
    }
    // O NOVO CREATE: Agora suporta a tabela LinhaPrescricao
    async create(dados) {
        return await prisma.prescricao.create({
            data: {
                data: new Date(),
                animalId: dados.animalId,
                funcionarioId: dados.funcionarioId,
                linhas: {
                    create: dados.linhas.map((linha) => ({
                        dosagem: linha.dosagem,
                        frequencia: linha.frequencia,
                        medicamentoId: linha.medicamentoId
                    }))
                }
            },
            include: { linhas: { include: { medicamento: { include: { stock: true } } } } } // Devolve as linhas para a Facade descontar o stock
        });
    }
    async findByAnimal(animalId) {
        return await prisma.prescricao.findMany({
            where: { animalId },
            include: {
                linhas: {
                    include: {
                        medicamento: {
                            include: { stock: true }
                        }
                    }
                },
                funcionario: {
                    include: { utilizador: true }
                },
                animal: true
            },
            orderBy: { data: 'desc' }
        });
    }
    // A MÁGICA DO BOOLEANO: Lista cães hospedados que ainda não têm o "check" feito hoje
    async listarCaesParaVerificar() {
        return await prisma.animal.findMany({
            where: {
                check: false, // Usa o teu novo atributo de forma super otimizada!
                reservas: {
                    some: { estado: 'CheckIn' } // Só puxa os cães que já deram entrada no hotel
                }
            },
            include: {
                tutor: { include: { utilizador: true } },
                reservas: {
                    where: { estado: 'CheckIn' },
                    include: { box: true }
                }
            }
        });
    }
    // Regista um check diário da veterinária
    async registarCheckDiario(idAnimal, notas) {
        // 1. Muda o boolean para true para desaparecer da lista de verificações
        await prisma.animal.update({
            where: { idAnimal },
            data: { check: true }
        });
        // 2. CRIA um novo registo no diário de bordo com as notas
        return await prisma.diarioBordo.create({
            data: {
                descricao: `[CHECK VETERINÁRIO] ${notas}`,
                animalId: idAnimal
            }
        });
    }
    // Ativa quarentena para um animal
    async ativarQuarentena(idAnimal, motivo) {
        const animalAtualizado = await prisma.animal.update({
            where: { idAnimal },
            data: { estado: 'Quarentena' }
        });
        // Regista o alerta no diário
        await prisma.diarioBordo.create({
            data: {
                descricao: `🚨 [QUARENTENA] ${motivo}`,
                animalId: idAnimal
            }
        });
        return animalAtualizado;
    }
    // Desativa quarentena
    async desativarQuarentena(idAnimal) {
        const animalAtualizado = await prisma.animal.update({
            where: { idAnimal },
            data: { estado: 'Saudavel' }
        });
        // Regista a alta no diário
        await prisma.diarioBordo.create({
            data: {
                descricao: `✅ [ALTA MÉDICA] O animal foi retirado da quarentena.`,
                animalId: idAnimal
            }
        });
        return animalAtualizado;
    }
    // Lista cães em quarentena
    async listarEmQuarentena() {
        return await prisma.animal.findMany({
            where: { estado: 'Quarentena' },
            include: {
                tutor: { include: { utilizador: true } },
                diarioBordo: { orderBy: { timestamp: 'desc' }, take: 5 }
            }
        });
    }
    // Verifica se um animal já foi verificado hoje
    async verificarSeJaFoiCheckHoje(idAnimal) {
        const animal = await prisma.animal.findUnique({
            where: { idAnimal },
            select: { check: true }
        });
        return animal?.check ?? false;
    }
}
exports.PrescricaoDAO = PrescricaoDAO;

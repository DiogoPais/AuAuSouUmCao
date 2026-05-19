"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilizadorDAO = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class UtilizadorDAO {
    // Procura um utilizador pelo Email (usado no Login e no Registo)
    async findByEmail(email) {
        return await prisma.utilizador.findFirst({
            where: { email: email },
            include: {
                tutor: true,
                funcionario: true
            }
        });
    }
    // Cria um novo Utilizador que é Tutor (usado no Registo)
    async createTutor(nome, email, passwordHash, nif, telemovel) {
        return await prisma.utilizador.create({
            data: {
                nome: nome,
                email: email,
                password: passwordHash,
                tutor: {
                    create: {
                        nif: nif,
                        contacto: telemovel
                    }
                }
            }
        });
    }
    async countTotal() {
        return await prisma.funcionario.count();
    }
    // Conta funcionários por perfil
    async countByPerfil(perfil) {
        return await prisma.funcionario.count({
            where: { perfil: 'Staff' }
        });
    }
    // Lista todos os funcionários com seus dados
    async findAll() {
        return await prisma.funcionario.findMany({
            include: {
                utilizador: true
            }
        });
    }
    // Busca funcionário pelo ID
    async findById(idFuncionario) {
        return await prisma.funcionario.findUnique({
            where: { idFuncionario },
            include: {
                utilizador: true
            }
        });
    }
    // Busca todos os funcionários de um determinado perfil (usado para o Round-Robin do Staff)
    async findByPerfil(perfil) {
        return await prisma.funcionario.findMany({
            where: { perfil: perfil }
        });
    }
}
exports.UtilizadorDAO = UtilizadorDAO;

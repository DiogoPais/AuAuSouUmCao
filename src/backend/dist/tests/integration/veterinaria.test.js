"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const api_1 = __importDefault(require("../../routes/api"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/', api_1.default);
const prisma = new client_1.PrismaClient();
describe('Testes de Integração - API de Veterinária (Prescrições e Stock)', () => {
    let token;
    let animalIdTeste;
    let stockIdTeste;
    const limparDB = async () => {
        await prisma.linhaPrescricao?.deleteMany?.();
        await prisma.prescricao?.deleteMany?.();
        await prisma.stock.deleteMany();
        await prisma.medicamento.deleteMany();
        await prisma.animal.deleteMany({ where: { tutorNif: '888777666' } });
        await prisma.tutor.deleteMany({ where: { nif: '888777666' } });
        await prisma.funcionario.deleteMany({ where: { idFuncionario: 'vet-teste-integracao' } });
        await prisma.utilizador.deleteMany({ where: { email: { in: ['vet.teste@hotel.com', 'tutor.vet@teste.com'] } } });
    };
    beforeAll(async () => {
        await limparDB();
        // 1. Criar Utilizador e Funcionario (O Veterinário)
        const userVet = await prisma.utilizador.create({
            data: {
                idUtilizador: 'vet-teste-integracao',
                nome: 'Dra. Teste',
                email: 'vet.teste@hotel.com',
                password: 'hash',
                funcionario: {
                    create: {
                        perfil: 'Vet' // <-- CORREÇÃO: No teu seed.ts o perfil chama-se 'Vet' e não 'Veterinario'!
                    }
                }
            }
        });
        // 2. Criar Tutor e Animal
        await prisma.utilizador.create({
            data: {
                idUtilizador: 'tutor-teste-vet',
                nome: 'Tutor Vet',
                email: 'tutor.vet@teste.com',
                password: 'hash',
                tutor: {
                    create: {
                        nif: '888777666',
                        contacto: '920000000'
                    }
                }
            }
        });
        const animal = await prisma.animal.create({
            data: {
                nome: 'Rex Clínico',
                microchip: 'CHIP-VET-123',
                reatividade: 'Não Reativo',
                tutorNif: '888777666'
            }
        });
        animalIdTeste = animal.idAnimal;
        // 3. Criar o Stock e Medicamento
        const stock = await prisma.stock.create({
            data: {
                nome: 'Vacina X',
                quantidade: 20,
                limiteAlerta: 5,
                medicamento: {
                    create: {
                        concentracao: 100
                    }
                }
            }
        });
        stockIdTeste = stock.idItem;
        // 4. Gerar Token para a Dra. Teste
        token = jsonwebtoken_1.default.sign({ userId: userVet.idUtilizador, role: 'Vet' }, // <-- Aqui também mudamos para 'Vet'
        process.env.JWT_SECRET || 'chave_secreta_hotel_canino_2026', { expiresIn: '1h' });
    });
    afterAll(async () => {
        await limparDB();
        await prisma.$disconnect();
    });
    describe('POST /veterinaria/prescricao', () => {
        it('deve criar uma prescrição e deduzir stock com sucesso (HTTP 201)', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/veterinaria/prescricao')
                .set('Authorization', `Bearer ${token}`)
                .send({
                animalId: animalIdTeste,
                linhas: [
                    {
                        medicamentoId: 'Vacina X',
                        dosagem: 2,
                        frequencia: '12/12h', // <-- CAMPO ADICIONADO AQUI
                        totalDoses: 5
                    }
                ]
            });
            expect(res.status).toBe(201);
            expect(res.body).toBeDefined();
            const stockAtualizado = await prisma.stock.findUnique({ where: { idItem: stockIdTeste } });
            expect(stockAtualizado?.quantidade).toBe(10);
        });
        it('deve falhar (HTTP 400) se o veterinário tentar prescrever mais do que há em stock', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/veterinaria/prescricao')
                .set('Authorization', `Bearer ${token}`)
                .send({
                animalId: animalIdTeste,
                linhas: [
                    {
                        medicamentoId: 'Vacina X',
                        dosagem: 5,
                        frequencia: '12/12h', // <-- CAMPO ADICIONADO AQUI TAMBÉM
                        totalDoses: 5
                    }
                ]
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/Stock insuficiente/i);
        });
    });
});

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
describe('Testes de Integração - API de Reservas', () => {
    let token;
    let animalIdTeste;
    let reservaIdTeste;
    const limparDB = async () => {
        await prisma.diarioBordo.deleteMany();
        await prisma.faturas?.deleteMany?.() || await prisma.fatura?.deleteMany?.();
        await prisma.servico.deleteMany();
        await prisma.reserva.deleteMany();
        await prisma.animal.deleteMany({ where: { tutorNif: '999888777' } });
        await prisma.tutor.deleteMany({ where: { nif: '999888777' } });
        await prisma.utilizador.deleteMany({ where: { email: 'tutor.reservas@teste.com' } });
    };
    beforeAll(async () => {
        await limparDB();
        const user = await prisma.utilizador.create({
            data: {
                idUtilizador: 'utilizador-teste-reserva',
                nome: 'Tutor Reservas',
                email: 'tutor.reservas@teste.com',
                password: 'hash_qualquer',
                tutor: {
                    create: {
                        nif: '999888777',
                        contacto: '910000000'
                    }
                }
            }
        });
        const animal = await prisma.animal.create({
            data: {
                nome: 'Bobby de Teste',
                microchip: 'CHIP-TESTE-RES',
                reatividade: 'Não Reativo',
                tutorNif: '999888777'
            }
        });
        animalIdTeste = animal.idAnimal;
        // CORREÇÃO: Assinar o token exatamente com a mesma secret que o teu auth.ts espera!
        token = jsonwebtoken_1.default.sign({ userId: user.idUtilizador, role: 'Tutor' }, process.env.JWT_SECRET || 'chave_secreta_hotel_canino_2026', { expiresIn: '1h' });
    });
    afterAll(async () => {
        await limparDB();
        await prisma.$disconnect();
    });
    // =====================================
    // TESTES DE CRIAÇÃO (POST)
    // =====================================
    describe('POST /reservas', () => {
        it('deve criar uma reserva com sucesso (HTTP 201)', async () => {
            const dataEntrada = new Date(Date.now() + 86400000).toISOString();
            const dataSaida = new Date(Date.now() + 3 * 86400000).toISOString();
            const res = await (0, supertest_1.default)(app)
                .post('/reservas')
                .set('Authorization', `Bearer ${token}`)
                .send({
                idAnimal: animalIdTeste,
                dataEntrada,
                dataSaida,
                banhos: 1,
                valor: 100
            });
            expect(res.status).toBe(201);
            expect(res.body.idReserva).toBeDefined();
            expect(res.body.estado).toBe('Pendente');
            reservaIdTeste = res.body.idReserva;
        });
        it('deve falhar (HTTP 400) se o animal tentar marcar duas vezes para as mesmas datas', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/reservas')
                .set('Authorization', `Bearer ${token}`)
                .send({
                idAnimal: animalIdTeste,
                dataEntrada: new Date(Date.now() + 5 * 86400000).toISOString(),
                dataSaida: new Date(Date.now() + 6 * 86400000).toISOString(),
                valor: 50
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/já possui uma reserva/i);
        });
    });
    // =====================================
    // TESTES DE CHECK-IN E CHECK-OUT (PATCH)
    // =====================================
    describe('Fluxo da Receção: Check-In e Check-Out', () => {
        it('deve falhar o Check-in (HTTP 400) se os termos não forem aceites', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch(`/reservas/${reservaIdTeste}/checkin`)
                .set('Authorization', `Bearer ${token}`)
                .send({ termosAceites: false });
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/termos/i);
        });
        it('deve aprovar o Check-in e mudar o estado (HTTP 200) com termos aceites', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch(`/reservas/${reservaIdTeste}/checkin`)
                .set('Authorization', `Bearer ${token}`)
                .send({ termosAceites: true });
            expect(res.status).toBe(200);
            expect(res.body.estado).toBe('CheckIn');
        });
        it('deve falhar o Check-out (HTTP 400) sem método de pagamento', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch(`/reservas/${reservaIdTeste}/checkout`)
                .set('Authorization', `Bearer ${token}`)
                .send({ metodoPagamento: '' });
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/método de pagamento/i);
        });
        it('deve processar o Check-out e gerar a Fatura Final (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch(`/reservas/${reservaIdTeste}/checkout`)
                .set('Authorization', `Bearer ${token}`)
                .send({ metodoPagamento: 'MBWay' });
            expect(res.status).toBe(200);
            expect(res.body.fatura).toBeDefined();
            expect(res.body.fatura.metodoPagamento).toBe('MBWay');
            expect(res.body.fatura.valorTotal).toBeDefined();
        });
    });
});

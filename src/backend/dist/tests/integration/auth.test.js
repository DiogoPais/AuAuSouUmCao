"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const api_1 = __importDefault(require("../../routes/api"));
const client_1 = require("@prisma/client");
// 1. Criar uma app Express virtual (em memória) para o Supertest bater
const app = (0, express_1.default)();
app.use(express_1.default.json()); // Obrigatório para ler req.body
app.use('/', api_1.default);
const prisma = new client_1.PrismaClient();
describe('Testes de Integração - API de Autenticação', () => {
    const testUser = {
        username: 'Tutor de Teste',
        email: 'teste.integracao@hotel.com',
        nif: '999888777',
        telemovel: '919999999',
        password: 'PasswordSegura123'
    };
    // LIMPEZA DE SEGURANÇA: Apagar o utilizador de teste antes E depois dos testes 
    // para garantir que a Base de Dados não acumula lixo.
    const limparDB = async () => {
        // CORREÇÃO: Utilizar o nome dos modelos no singular, como definido no teu schema.prisma
        await prisma.tutor.deleteMany({ where: { nif: testUser.nif } });
        await prisma.utilizador.deleteMany({ where: { email: testUser.email } });
    };
    beforeAll(async () => {
        await limparDB();
    });
    afterAll(async () => {
        await limparDB();
        await prisma.$disconnect();
    });
    describe('POST /register', () => {
        it('deve registar um novo tutor com sucesso e retornar HTTP 201', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/register')
                .send(testUser);
            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Conta criada com sucesso!');
            expect(res.body.user).toBeDefined();
            expect(res.body.user.email).toBe(testUser.email);
        });
        it('deve devolver erro HTTP 400 se o email já estiver registado', async () => {
            // Tentamos enviar os mesmos dados uma segunda vez
            const res = await (0, supertest_1.default)(app)
                .post('/register')
                .send(testUser);
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });
    });
    describe('POST /login', () => {
        it('deve devolver erro HTTP 401 para credenciais inválidas (password errada)', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/login')
                .send({
                username: testUser.email,
                password: 'PasswordIncorreta!!!'
            });
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Credenciais inválidas.');
        });
        it('deve fazer login com sucesso e exigir código 2FA para Tutores', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/login')
                .send({
                username: testUser.email,
                password: testUser.password
            });
            expect(res.status).toBe(200);
            expect(res.body.requires2FA).toBe(true);
            expect(res.body.email).toBe(testUser.email);
            expect(res.body.message).toMatch(/Código de confirmação/i);
        });
    });
});

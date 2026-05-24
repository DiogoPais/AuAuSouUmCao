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
const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_hotel_canino_2026';
/**
 * Testes de integração adicionais.
 * Cobrem as rotas que estavam sem testes:
 *   - GET /animais, GET /animais/tutor/:nif
 *   - PATCH /plano-vacinal/:idAnimal
 *   - GET /tarefas, PATCH /tarefas/:id/concluir
 *   - GET /tarefas/limpezas, PATCH /tarefas/limpezas/:numero
 *   - GET /veterinaria/caes-para-verificar
 *   - PATCH /veterinaria/quarentena/:idAnimal
 *   - GET /stock, PATCH /stock/:idItem/reforcar
 *   - GET /faturas/tutor/:nif
 *   - Rotas protegidas sem token (auth)
 */
describe('Testes de Integração - Rotas Adicionais', () => {
    let tokenVet;
    let tokenStaff;
    let tokenTutor;
    let animalId;
    let stockId;
    let servicoId;
    let funcionarioStaffId; // idFuncionario real (FK de Servico)
    const NIF_TUTOR = '111222333';
    const EMAIL_TUTOR = 'tutor.extra@teste.com';
    const EMAIL_VET = 'vet.extra@teste.com';
    const EMAIL_STAFF = 'staff.extra@teste.com';
    const limparDB = async () => {
        await prisma.diarioBordo.deleteMany();
        await prisma.servico.deleteMany();
        await prisma.reserva.deleteMany();
        await prisma.planoVacinal.deleteMany();
        await prisma.animal.deleteMany({ where: { tutorNif: NIF_TUTOR } });
        await prisma.tutor.deleteMany({ where: { nif: NIF_TUTOR } });
        await prisma.stock.deleteMany({ where: { nome: 'Antibiotico Extra' } });
        await prisma.utilizador.deleteMany({
            where: { email: { in: [EMAIL_TUTOR, EMAIL_VET, EMAIL_STAFF] } }
        });
    };
    beforeAll(async () => {
        await limparDB();
        // --- Tutor ---
        const userTutor = await prisma.utilizador.create({
            data: {
                idUtilizador: 'tutor-extra-id',
                nome: 'Tutor Extra',
                email: EMAIL_TUTOR,
                password: 'hash',
                tutor: { create: { nif: NIF_TUTOR, contacto: '911111111' } }
            }
        });
        tokenTutor = jsonwebtoken_1.default.sign({ userId: userTutor.idUtilizador, role: 'Tutor' }, JWT_SECRET, { expiresIn: '1h' });
        // --- Veterinário ---
        const userVet = await prisma.utilizador.create({
            data: {
                idUtilizador: 'vet-extra-id',
                nome: 'Vet Extra',
                email: EMAIL_VET,
                password: 'hash',
                funcionario: { create: { perfil: 'Vet' } }
            }
        });
        tokenVet = jsonwebtoken_1.default.sign({ userId: userVet.idUtilizador, role: 'Vet' }, JWT_SECRET, { expiresIn: '1h' });
        // --- Staff ---
        // Criamos o utilizador+funcionario e guardamos o idFuncionario real para usar na FK de Servico
        const userStaff = await prisma.utilizador.create({
            data: {
                idUtilizador: 'staff-extra-id',
                nome: 'Staff Extra',
                email: EMAIL_STAFF,
                password: 'hash',
                funcionario: { create: { perfil: 'Staff' } }
            },
            include: { funcionario: true }
        });
        // idFuncionario é o PK de Funcionario, diferente de idUtilizador
        funcionarioStaffId = userStaff.funcionario.idFuncionario;
        tokenStaff = jsonwebtoken_1.default.sign({ userId: userStaff.idUtilizador, role: 'Staff' }, JWT_SECRET, { expiresIn: '1h' });
        // --- Animal ---
        const animal = await prisma.animal.create({
            data: {
                nome: 'Luna Extra',
                microchip: 'CHIP-EXTRA-999',
                reatividade: 'Não Reativo',
                tutorNif: NIF_TUTOR
            }
        });
        animalId = animal.idAnimal;
        // Criar PlanoVacinal para o animal (campo documento obrigatório no schema)
        // Sem isto, o PATCH /plano-vacinal tenta CREATE em vez de UPDATE e falha por falta do campo
        await prisma.planoVacinal.create({
            data: {
                dataUltimaVacina: new Date('2025-01-01'),
                documento: 'doc-teste-inicial.pdf',
                isValido: false,
                estado: 'Valido',
                animalId
            }
        });
        // --- Stock ---
        const stock = await prisma.stock.create({
            data: {
                nome: 'Antibiotico Extra',
                quantidade: 50,
                limiteAlerta: 5,
                medicamento: { create: { concentracao: 200 } }
            }
        });
        stockId = stock.idItem;
        // --- Reserva + Serviço ---
        // A box 1 tem de existir; se não existir no seed, criamos uma box neutra
        await prisma.box.upsert({
            where: { numero: 1 },
            update: {},
            create: { numero: 1, tipo: 'Normal', estado: 'Disponivel' }
        });
        const entrada = new Date(Date.now() + 86400000);
        const saida = new Date(Date.now() + 3 * 86400000);
        const reserva = await prisma.reserva.create({
            data: {
                animalId,
                estado: 'CheckIn',
                valor: 80,
                dataEntrada: entrada,
                dataSaida: saida,
                boxNumero: 1,
                servicos: {
                    create: {
                        tipo: 'Alimentacao',
                        data: new Date(),
                        preco: 0,
                        estado: 'Pendente',
                        // Usar o idFuncionario real (FK correta) em vez do idUtilizador
                        funcionarioId: funcionarioStaffId
                    }
                }
            },
            include: { servicos: true }
        });
        servicoId = reserva.servicos[0].idServico;
    });
    afterAll(async () => {
        await limparDB();
        await prisma.$disconnect();
    });
    // ============================================================
    // Proteção de rotas — sem token JWT
    // ============================================================
    describe('Proteção de rotas - sem token JWT', () => {
        it('GET /animais deve retornar 401 sem token', async () => {
            const res = await (0, supertest_1.default)(app).get('/animais');
            expect(res.status).toBe(401);
        });
        it('GET /reservas deve retornar 401 sem token', async () => {
            const res = await (0, supertest_1.default)(app).get('/reservas');
            expect(res.status).toBe(401);
        });
        it('GET /stock deve retornar 401 sem token', async () => {
            const res = await (0, supertest_1.default)(app).get('/stock');
            expect(res.status).toBe(401);
        });
    });
    // ============================================================
    // Animais
    // ============================================================
    describe('GET /animais e /animais/tutor/:nif', () => {
        it('GET /animais deve retornar lista de animais (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/animais')
                .set('Authorization', `Bearer ${tokenVet}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('GET /animais/tutor/:nif deve retornar os animais do tutor (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get(`/animais/tutor/${NIF_TUTOR}`)
                .set('Authorization', `Bearer ${tokenTutor}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });
    // ============================================================
    // Plano vacinal
    // ============================================================
    describe('PATCH /plano-vacinal/:idAnimal', () => {
        it('deve atualizar o plano vacinal com data válida (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch(`/plano-vacinal/${animalId}`)
                .set('Authorization', `Bearer ${tokenVet}`)
                .send({ dataUltimaVacina: '2026-01-15', isValido: true });
            expect(res.status).toBe(200);
        });
        it('deve falhar com animal inexistente (HTTP 400/404/500)', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch('/plano-vacinal/animal-que-nao-existe')
                .set('Authorization', `Bearer ${tokenVet}`)
                .send({ dataUltimaVacina: '2026-01-15' });
            expect([400, 404, 500]).toContain(res.status);
        });
    });
    // ============================================================
    // Tarefas
    // ============================================================
    describe('GET /tarefas e conclusão de tarefas', () => {
        it('GET /tarefas deve retornar lista de tarefas do dia (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/tarefas')
                .set('Authorization', `Bearer ${tokenStaff}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('PATCH /tarefas/:id/concluir deve marcar a tarefa como concluída (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch(`/tarefas/${servicoId}/concluir`)
                .set('Authorization', `Bearer ${tokenStaff}`)
                .send({ nomeStaff: 'Staff Extra' });
            expect(res.status).toBe(200);
        });
        it('PATCH /tarefas/:id/concluir deve falhar com id inválido (HTTP 400/404/500)', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch('/tarefas/tarefa-inexistente/concluir')
                .set('Authorization', `Bearer ${tokenStaff}`)
                .send({ nomeStaff: 'Staff Extra' });
            expect([400, 404, 500]).toContain(res.status);
        });
    });
    // ============================================================
    // Limpezas de boxes
    // ============================================================
    describe('GET /tarefas/limpezas e PATCH /tarefas/limpezas/:numero', () => {
        it('GET /tarefas/limpezas deve retornar as boxes sujas (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/tarefas/limpezas')
                .set('Authorization', `Bearer ${tokenStaff}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('PATCH /tarefas/limpezas/1 deve responder com sucesso ou 404 (HTTP 200/404/500)', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch('/tarefas/limpezas/1')
                .set('Authorization', `Bearer ${tokenStaff}`);
            expect([200, 404, 500]).toContain(res.status);
        });
    });
    // ============================================================
    // Veterinária
    // ============================================================
    describe('Rotas de veterinária', () => {
        it('GET /veterinaria/caes-para-verificar deve retornar lista (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/veterinaria/caes-para-verificar')
                .set('Authorization', `Bearer ${tokenVet}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('GET /veterinaria/caes-quarentena deve retornar lista (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/veterinaria/caes-quarentena')
                .set('Authorization', `Bearer ${tokenVet}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('POST /veterinaria/check-diario/:idAnimal deve registar check com notas (HTTP 200/201)', async () => {
            const res = await (0, supertest_1.default)(app)
                .post(`/veterinaria/check-diario/${animalId}`)
                .set('Authorization', `Bearer ${tokenVet}`)
                .send({ notas: 'Come bem, peso estável.', nomeVet: 'Dra. Diana' });
            expect([200, 201]).toContain(res.status);
        });
        it('PATCH /veterinaria/quarentena/:idAnimal deve ativar quarentena com motivo (HTTP 200/201)', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch(`/veterinaria/quarentena/${animalId}`)
                .set('Authorization', `Bearer ${tokenVet}`)
                .send({ motivo: 'Tosse suspeita de Bordetella' });
            expect([200, 201]).toContain(res.status);
        });
        it('GET /veterinaria/tratamentos-ativos deve retornar lista (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/veterinaria/tratamentos-ativos')
                .set('Authorization', `Bearer ${tokenVet}`);
            expect(res.status).toBe(200);
        });
        it('GET /veterinaria/prescricoes/:animalId deve retornar prescrições do animal (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get(`/veterinaria/prescricoes/${animalId}`)
                .set('Authorization', `Bearer ${tokenVet}`);
            expect(res.status).toBe(200);
        });
    });
    // ============================================================
    // Stock
    // ============================================================
    describe('GET /stock e PATCH /stock/:idItem/reforcar', () => {
        it('GET /stock deve retornar lista de itens (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/stock')
                .set('Authorization', `Bearer ${tokenVet}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('PATCH /stock/:idItem/reforcar deve adicionar quantidade ao stock (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch(`/stock/${stockId}/reforcar`)
                .set('Authorization', `Bearer ${tokenVet}`)
                .send({ quantidade: 10 });
            expect(res.status).toBe(200);
        });
        it('PATCH /stock/:idItem/reforcar deve falhar com quantidade zero (HTTP 400/500)', async () => {
            const res = await (0, supertest_1.default)(app)
                .patch(`/stock/${stockId}/reforcar`)
                .set('Authorization', `Bearer ${tokenVet}`)
                .send({ quantidade: 0 });
            expect([400, 500]).toContain(res.status);
        });
    });
    // ============================================================
    // Faturas
    // ============================================================
    describe('GET /faturas/tutor/:nif', () => {
        it('deve retornar as faturas do tutor (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get(`/faturas/tutor/${NIF_TUTOR}`)
                .set('Authorization', `Bearer ${tokenTutor}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
    // ============================================================
    // Funcionários
    // ============================================================
    describe('GET /funcionarios e /funcionarios/count', () => {
        it('GET /funcionarios/count deve retornar contagem (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/funcionarios/count')
                .set('Authorization', `Bearer ${tokenVet}`);
            expect(res.status).toBe(200);
        });
        it('GET /funcionarios deve retornar lista (HTTP 200)', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/funcionarios')
                .set('Authorization', `Bearer ${tokenVet}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
});

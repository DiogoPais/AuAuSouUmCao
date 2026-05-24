import request from 'supertest';
import express from 'express';
import apiRouter from '../../routes/api';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/', apiRouter);

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_hotel_canino_2026';

describe('Testes de Integração - Rotas Adicionais', () => {
  let tokenVet: string; let tokenStaff: string; let tokenTutor: string;
  let animalId: string; let stockId: string; let servicoId: string; let funcionarioStaffId: string;

  const NIF_TUTOR = '111222333';

  const limparDB = async () => {
    // Apagar especificamente apenas as coisas com o NIF 111222333
    await prisma.diarioBordo.deleteMany({ where: { reserva: { animal: { tutorNif: NIF_TUTOR } } } });
    await prisma.servico.deleteMany({ where: { reserva: { animal: { tutorNif: NIF_TUTOR } } } });
    await prisma.reserva.deleteMany({ where: { animal: { tutorNif: NIF_TUTOR } } });
    await prisma.planoVacinal.deleteMany({ where: { animal: { tutorNif: NIF_TUTOR } } });
    await prisma.animal.deleteMany({ where: { tutorNif: NIF_TUTOR } });
    await prisma.tutor.deleteMany({ where: { nif: NIF_TUTOR } });
    
    // Apagar Stock específico do teste
    const stockItem = await prisma.stock.findFirst({ where: { nome: 'TESTE-Antibiotico' } });
    if (stockItem) {
      await prisma.stock.delete({ where: { idItem: stockItem.idItem } });
    }

    // Apagar Utilizadores específicos do teste
    await prisma.funcionario.deleteMany({ where: { utilizador: { email: { startsWith: 'extra.' } } } });
    await prisma.utilizador.deleteMany({ where: { email: { startsWith: 'extra.' } } });
  };

  beforeAll(async () => {
    await limparDB();

    const userTutor = await prisma.utilizador.create({
      data: { idUtilizador: 'extra.tutor', nome: 'Tutor', email: 'extra.tutor@teste.com', password: 'hash', tutor: { create: { nif: NIF_TUTOR, contacto: '911' } } }
    });
    tokenTutor = jwt.sign({ userId: userTutor.idUtilizador, role: 'Tutor' }, JWT_SECRET, { expiresIn: '1h' });

    const userVet = await prisma.utilizador.create({
      data: { idUtilizador: 'extra.vet', nome: 'Vet', email: 'extra.vet@teste.com', password: 'hash', funcionario: { create: { perfil: 'Vet' } } }
    });
    tokenVet = jwt.sign({ userId: userVet.idUtilizador, role: 'Vet' }, JWT_SECRET, { expiresIn: '1h' });

    const userStaff = await prisma.utilizador.create({
      data: { idUtilizador: 'extra.staff', nome: 'Staff', email: 'extra.staff@teste.com', password: 'hash', funcionario: { create: { perfil: 'Staff' } } },
      include: { funcionario: true }
    });
    funcionarioStaffId = userStaff.funcionario!.idFuncionario;
    tokenStaff = jwt.sign({ userId: userStaff.idUtilizador, role: 'Staff' }, JWT_SECRET, { expiresIn: '1h' });

    const animal = await prisma.animal.create({
      data: { nome: 'Luna', microchip: 'CHIP-TESTE-EXTRA', reatividade: 'Não Reativo', tutorNif: NIF_TUTOR, planoVacinal: { create: { dataUltimaVacina: new Date(), documento: 'doc.pdf', isValido: false, estado: 'Valido' } } }
    });
    animalId = animal.idAnimal;

    const stock = await prisma.stock.create({
      data: { nome: 'TESTE-Antibiotico', quantidade: 50, limiteAlerta: 5, medicamento: { create: { concentracao: 200 } } }
    });
    stockId = stock.idItem;

    await prisma.box.upsert({ where: { numero: 999 }, update: {}, create: { numero: 999, tipo: 'Normal', estado: 'Disponivel' } });

    const reserva = await prisma.reserva.create({
      data: { animalId, estado: 'CheckIn', valor: 80, dataEntrada: new Date(), dataSaida: new Date(Date.now() + 86400000), boxNumero: 999, servicos: { create: { tipo: 'Alimentacao', data: new Date(), preco: 0, estado: 'Pendente', funcionarioId: funcionarioStaffId } } },
      include: { servicos: true }
    });
    servicoId = reserva.servicos[0].idServico;
  });

  afterAll(async () => {
    await limparDB();
    await prisma.box.deleteMany({ where: { numero: 999 } });
    await prisma.$disconnect();
  });

  // O RESTO DOS TEUS TESTES EXACTAMENTE IGUAIS
  describe('Proteção de rotas - sem token JWT', () => {
    it('GET /animais deve retornar 401 sem token', async () => { const res = await request(app).get('/animais'); expect(res.status).toBe(401); });
    it('GET /reservas deve retornar 401 sem token', async () => { const res = await request(app).get('/reservas'); expect(res.status).toBe(401); });
    it('GET /stock deve retornar 401 sem token', async () => { const res = await request(app).get('/stock'); expect(res.status).toBe(401); });
  });

  describe('GET /animais e /animais/tutor/:nif', () => {
    it('GET /animais deve retornar lista de animais (HTTP 200)', async () => { const res = await request(app).get('/animais').set('Authorization', `Bearer ${tokenVet}`); expect(res.status).toBe(200); });
    it('GET /animais/tutor/:nif deve retornar os animais do tutor (HTTP 200)', async () => { const res = await request(app).get(`/animais/tutor/${NIF_TUTOR}`).set('Authorization', `Bearer ${tokenTutor}`); expect(res.status).toBe(200); });
  });

  describe('PATCH /plano-vacinal/:idAnimal', () => {
    it('deve atualizar o plano vacinal com data válida (HTTP 200)', async () => { const res = await request(app).patch(`/plano-vacinal/${animalId}`).set('Authorization', `Bearer ${tokenVet}`).send({ dataUltimaVacina: '2026-01-15', isValido: true }); expect(res.status).toBe(200); });
    it('deve falhar com animal inexistente (HTTP 400/404/500)', async () => { const res = await request(app).patch('/plano-vacinal/animal-que-nao-existe').set('Authorization', `Bearer ${tokenVet}`).send({ dataUltimaVacina: '2026-01-15' }); expect([400, 404, 500]).toContain(res.status); });
  });

  describe('GET /tarefas e conclusão de tarefas', () => {
    it('GET /tarefas deve retornar lista de tarefas do dia (HTTP 200)', async () => { const res = await request(app).get('/tarefas').set('Authorization', `Bearer ${tokenStaff}`); expect(res.status).toBe(200); });
    it('PATCH /tarefas/:id/concluir deve marcar a tarefa como concluída (HTTP 200)', async () => { const res = await request(app).patch(`/tarefas/${servicoId}/concluir`).set('Authorization', `Bearer ${tokenStaff}`).send({ nomeStaff: 'Staff Extra' }); expect(res.status).toBe(200); });
    it('PATCH /tarefas/:id/concluir deve falhar com id inválido (HTTP 400/404/500)', async () => { const res = await request(app).patch('/tarefas/tarefa-inexistente/concluir').set('Authorization', `Bearer ${tokenStaff}`).send({ nomeStaff: 'Staff Extra' }); expect([400, 404, 500]).toContain(res.status); });
  });

  describe('GET /tarefas/limpezas e PATCH /tarefas/limpezas/:numero', () => {
    it('GET /tarefas/limpezas deve retornar as boxes sujas (HTTP 200)', async () => { const res = await request(app).get('/tarefas/limpezas').set('Authorization', `Bearer ${tokenStaff}`); expect(res.status).toBe(200); });
    it('PATCH /tarefas/limpezas/999 deve responder com sucesso ou 404 (HTTP 200/404/500)', async () => { const res = await request(app).patch('/tarefas/limpezas/999').set('Authorization', `Bearer ${tokenStaff}`); expect([200, 404, 500]).toContain(res.status); });
  });

  describe('Rotas de veterinária', () => {
    it('GET /veterinaria/caes-para-verificar deve retornar lista (HTTP 200)', async () => { const res = await request(app).get('/veterinaria/caes-para-verificar').set('Authorization', `Bearer ${tokenVet}`); expect(res.status).toBe(200); });
    it('GET /veterinaria/caes-quarentena deve retornar lista (HTTP 200)', async () => { const res = await request(app).get('/veterinaria/caes-quarentena').set('Authorization', `Bearer ${tokenVet}`); expect(res.status).toBe(200); });
    it('POST /veterinaria/check-diario/:idAnimal deve registar check com notas (HTTP 200/201)', async () => { const res = await request(app).post(`/veterinaria/check-diario/${animalId}`).set('Authorization', `Bearer ${tokenVet}`).send({ notas: 'Come bem, peso estável.', nomeVet: 'Dra. Diana' }); expect([200, 201]).toContain(res.status); });
    it('PATCH /veterinaria/quarentena/:idAnimal deve ativar quarentena com motivo (HTTP 200/201)', async () => { const res = await request(app).patch(`/veterinaria/quarentena/${animalId}`).set('Authorization', `Bearer ${tokenVet}`).send({ motivo: 'Tosse suspeita de Bordetella' }); expect([200, 201]).toContain(res.status); });
    it('GET /veterinaria/tratamentos-ativos deve retornar lista (HTTP 200)', async () => { const res = await request(app).get('/veterinaria/tratamentos-ativos').set('Authorization', `Bearer ${tokenVet}`); expect(res.status).toBe(200); });
    it('GET /veterinaria/prescricoes/:animalId deve retornar prescrições do animal (HTTP 200)', async () => { const res = await request(app).get(`/veterinaria/prescricoes/${animalId}`).set('Authorization', `Bearer ${tokenVet}`); expect(res.status).toBe(200); });
  });

  describe('GET /stock e PATCH /stock/:idItem/reforcar', () => {
    it('GET /stock deve retornar lista de itens (HTTP 200)', async () => { const res = await request(app).get('/stock').set('Authorization', `Bearer ${tokenVet}`); expect(res.status).toBe(200); });
    it('PATCH /stock/:idItem/reforcar deve adicionar quantidade ao stock (HTTP 200)', async () => { const res = await request(app).patch(`/stock/${stockId}/reforcar`).set('Authorization', `Bearer ${tokenVet}`).send({ quantidade: 10 }); expect(res.status).toBe(200); });
    it('PATCH /stock/:idItem/reforcar deve falhar com quantidade zero (HTTP 400/500)', async () => { const res = await request(app).patch(`/stock/${stockId}/reforcar`).set('Authorization', `Bearer ${tokenVet}`).send({ quantidade: 0 }); expect([400, 500]).toContain(res.status); });
  });

  describe('GET /faturas/tutor/:nif', () => {
    it('deve retornar as faturas do tutor (HTTP 200)', async () => { const res = await request(app).get(`/faturas/tutor/${NIF_TUTOR}`).set('Authorization', `Bearer ${tokenTutor}`); expect(res.status).toBe(200); });
  });

  describe('GET /funcionarios e /funcionarios/count', () => {
    it('GET /funcionarios/count deve retornar contagem (HTTP 200)', async () => { const res = await request(app).get('/funcionarios/count').set('Authorization', `Bearer ${tokenVet}`); expect(res.status).toBe(200); });
    it('GET /funcionarios deve retornar lista (HTTP 200)', async () => { const res = await request(app).get('/funcionarios').set('Authorization', `Bearer ${tokenVet}`); expect(res.status).toBe(200); });
  });
});
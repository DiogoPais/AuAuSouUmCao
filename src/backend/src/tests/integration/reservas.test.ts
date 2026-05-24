import request from 'supertest';
import express from 'express';
import apiRouter from '../../routes/api';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/', apiRouter);

const prisma = new PrismaClient();

describe('Testes de Integração - API de Reservas', () => {
  let token: string; let animalIdTeste: string; let reservaIdTeste: string;
  const NIF_TESTE = '999888777';

  const limparDB = async () => {
    await prisma.diarioBordo.deleteMany({ where: { reserva: { animal: { tutorNif: NIF_TESTE } } } }); 
    await (prisma as any).faturas?.deleteMany?.({ where: { nifCliente: NIF_TESTE } }) || await (prisma as any).fatura?.deleteMany?.({ where: { nifCliente: NIF_TESTE } });
    await prisma.servico.deleteMany({ where: { reserva: { animal: { tutorNif: NIF_TESTE } } } }); 
    await prisma.reserva.deleteMany({ where: { animal: { tutorNif: NIF_TESTE } } }); 
    await prisma.animal.deleteMany({ where: { tutorNif: NIF_TESTE } });
    await prisma.tutor.deleteMany({ where: { nif: NIF_TESTE } });
    await prisma.utilizador.deleteMany({ where: { email: 'reserva.teste@hotel.com' } });
  };

  beforeAll(async () => {
    await limparDB();

    const user = await prisma.utilizador.create({
      data: { idUtilizador: 'reserva.teste.id', nome: 'Tutor Reservas', email: 'reserva.teste@hotel.com', password: 'hash', tutor: { create: { nif: NIF_TESTE, contacto: '910' } } }
    });

    const animal = await prisma.animal.create({
      data: { nome: 'Bobby', microchip: 'CHIP-TESTE-RESERVA', reatividade: 'Não Reativo', tutorNif: NIF_TESTE }
    });
    animalIdTeste = animal.idAnimal;

    token = jwt.sign({ userId: user.idUtilizador, role: 'Tutor' }, process.env.JWT_SECRET || 'chave_secreta_hotel_canino_2026', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await limparDB();
    await prisma.$disconnect();
  });

  // RESTO DOS TESTES...
  describe('POST /reservas', () => {
    it('deve criar uma reserva com sucesso (HTTP 201)', async () => {
      const res = await request(app).post('/reservas').set('Authorization', `Bearer ${token}`).send({ idAnimal: animalIdTeste, dataEntrada: new Date(Date.now() + 86400000).toISOString(), dataSaida: new Date(Date.now() + 3 * 86400000).toISOString(), banhos: 1, valor: 100 });
      expect(res.status).toBe(201);
      reservaIdTeste = res.body.idReserva; 
    });

    it('deve falhar (HTTP 400) ao duplicar datas', async () => {
      const res = await request(app).post('/reservas').set('Authorization', `Bearer ${token}`).send({ idAnimal: animalIdTeste, dataEntrada: new Date(Date.now() + 5 * 86400000).toISOString(), dataSaida: new Date(Date.now() + 6 * 86400000).toISOString(), valor: 50 });
      expect(res.status).toBe(400);
    });
  });

  describe('Fluxo da Receção', () => {
    it('deve falhar o Check-in sem termos', async () => { const res = await request(app).patch(`/reservas/${reservaIdTeste}/checkin`).set('Authorization', `Bearer ${token}`).send({ termosAceites: false }); expect(res.status).toBe(400); });
    it('deve aprovar o Check-in', async () => { const res = await request(app).patch(`/reservas/${reservaIdTeste}/checkin`).set('Authorization', `Bearer ${token}`).send({ termosAceites: true }); expect(res.status).toBe(200); });
    it('deve falhar o Check-out sem metodo', async () => { const res = await request(app).patch(`/reservas/${reservaIdTeste}/checkout`).set('Authorization', `Bearer ${token}`).send({ metodoPagamento: '' }); expect(res.status).toBe(400); });
    it('deve processar o Check-out', async () => { const res = await request(app).patch(`/reservas/${reservaIdTeste}/checkout`).set('Authorization', `Bearer ${token}`).send({ metodoPagamento: 'MBWay' }); expect(res.status).toBe(200); });
  });
});
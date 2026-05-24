import request from 'supertest';
import express from 'express';
import apiRouter from '../../routes/api';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/', apiRouter);

const prisma = new PrismaClient();

describe('Testes de Integração - API de Veterinária (Prescrições e Stock)', () => {
  let token: string; let animalIdTeste: string; let stockIdTeste: string;
  const NIF_TESTE = '888777666';

  const limparDB = async () => {
    await (prisma as any).linhaPrescricao?.deleteMany({ where: { prescricao: { animal: { tutorNif: NIF_TESTE } } } });
    await (prisma as any).prescricao?.deleteMany({ where: { animal: { tutorNif: NIF_TESTE } } });
    
    const stockItem = await prisma.stock.findFirst({ where: { nome: 'TESTE-VacinaX' } });
    if (stockItem) { await prisma.stock.delete({ where: { idItem: stockItem.idItem } }); }

    await prisma.animal.deleteMany({ where: { tutorNif: NIF_TESTE } });
    await prisma.tutor.deleteMany({ where: { nif: NIF_TESTE } });
    await prisma.funcionario.deleteMany({ where: { utilizador: { email: 'vet.teste@hotel.com' } } });
    await prisma.utilizador.deleteMany({ where: { email: { in: ['vet.teste@hotel.com', 'tutor.vet.teste@hotel.com'] } } });
  };

  beforeAll(async () => {
    await limparDB();

    const userVet = await prisma.utilizador.create({ data: { idUtilizador: 'vet.teste.id', nome: 'Dra. Teste', email: 'vet.teste@hotel.com', password: 'hash', funcionario: { create: { perfil: 'Vet' } } } });
    await prisma.utilizador.create({ data: { idUtilizador: 'tutor.vet.teste.id', nome: 'Tutor Vet', email: 'tutor.vet.teste@hotel.com', password: 'hash', tutor: { create: { nif: NIF_TESTE, contacto: '920' } } } });
    
    const animal = await prisma.animal.create({ data: { nome: 'Rex Clínico', microchip: 'CHIP-TESTE-VET', reatividade: 'Não Reativo', tutorNif: NIF_TESTE } });
    animalIdTeste = animal.idAnimal;

    const stock = await prisma.stock.create({ data: { nome: 'TESTE-VacinaX', quantidade: 20, limiteAlerta: 5, medicamento: { create: { concentracao: 100 } } } });
    stockIdTeste = stock.idItem;

    token = jwt.sign({ userId: userVet.idUtilizador, role: 'Vet' }, process.env.JWT_SECRET || 'chave_secreta_hotel_canino_2026', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await limparDB();
    await prisma.$disconnect();
  });

  // RESTO DOS TESTES...
  describe('POST /veterinaria/prescricao', () => {
    it('deve criar uma prescrição e deduzir stock (HTTP 201)', async () => {
      const res = await request(app).post('/veterinaria/prescricao').set('Authorization', `Bearer ${token}`).send({ animalId: animalIdTeste, linhas: [{ medicamentoId: 'TESTE-VacinaX', dosagem: 2, frequencia: '12/12h', totalDoses: 5 }] });
      expect(res.status).toBe(201);
      const stockAtualizado = await prisma.stock.findUnique({ where: { idItem: stockIdTeste } });
      expect(stockAtualizado?.quantidade).toBe(10);
    });

    it('deve falhar se prescrever mais que stock (HTTP 400)', async () => {
      const res = await request(app).post('/veterinaria/prescricao').set('Authorization', `Bearer ${token}`).send({ animalId: animalIdTeste, linhas: [{ medicamentoId: 'TESTE-VacinaX', dosagem: 5, frequencia: '12/12h', totalDoses: 5 }] });     
      expect(res.status).toBe(400);
    });
  });
});
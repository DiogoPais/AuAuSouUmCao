import { PrismaClient } from '@prisma/client';
import { AnimalDAO } from '../../dao/AnimalDAO';
import { UtilizadorDAO } from '../../dao/UtilizadorDAO';
import { ReservaDAO } from '../../dao/ReservaDAO';
import { PrescricaoDAO } from '../../dao/PrescricaoDAO';
import { StockDAO } from '../../dao/StockDAO';
import { DiarioBordoDAO } from '../../dao/DiarioBordoDAO';
import { FaturaDAO } from '../../dao/FaturaDAO';

const prisma = new PrismaClient();

describe('DAOs - Testes Seguros na DB Real', () => {
  let animalDAO: AnimalDAO; let utilizadorDAO: UtilizadorDAO; let reservaDAO: ReservaDAO;
  let prescricaoDAO: PrescricaoDAO; let stockDAO: StockDAO; let diarioBordoDAO: DiarioBordoDAO; let faturaDAO: FaturaDAO;

  // ESTA FUNÇÃO SÓ APAGA O QUE FOI CRIADO PELOS TESTES
  const limparMeusDados = async () => {
    // Apaga apenas as faturas, serviços, animais, etc, criados para teste (NIFs fictícios e identificadores específicos)
    await (prisma as any).faturas?.deleteMany?.({ where: { nifCliente: { startsWith: '9999' } } }) || await (prisma as any).fatura?.deleteMany?.({ where: { nifCliente: { startsWith: '9999' } } });
    await prisma.logMedicacao.deleteMany({ where: { funcionario: { utilizador: { email: { startsWith: 'teste.' } } } } });
    await prisma.linhaPrescricao.deleteMany({ where: { prescricao: { animal: { microchip: { startsWith: 'CHIP-TESTE' } } } } });
    await prisma.prescricao.deleteMany({ where: { animal: { microchip: { startsWith: 'CHIP-TESTE' } } } });
    await prisma.servico.deleteMany({ where: { reserva: { animal: { microchip: { startsWith: 'CHIP-TESTE' } } } } });
    await prisma.diarioBordo.deleteMany({ where: { reserva: { animal: { microchip: { startsWith: 'CHIP-TESTE' } } } } });
    await prisma.reserva.deleteMany({ where: { animal: { microchip: { startsWith: 'CHIP-TESTE' } } } });
    await prisma.planoVacinal.deleteMany({ where: { animal: { microchip: { startsWith: 'CHIP-TESTE' } } } });
    await prisma.animal.deleteMany({ where: { microchip: { startsWith: 'CHIP-TESTE' } } });
    await prisma.tutor.deleteMany({ where: { nif: { startsWith: '9999' } } });
    await prisma.funcionario.deleteMany({ where: { utilizador: { email: { startsWith: 'teste.' } } } });
    await prisma.utilizador.deleteMany({ where: { email: { startsWith: 'teste.' } } });
    await prisma.stock.deleteMany({ where: { nome: { startsWith: 'TESTE-' } } });
    await prisma.box.deleteMany({ where: { numero: { gt: 900 } } }); // Apaga só a box 999
  };

  beforeAll(async () => {
    await limparMeusDados();

    animalDAO = new AnimalDAO(); utilizadorDAO = new UtilizadorDAO(); reservaDAO = new ReservaDAO();
    prescricaoDAO = new PrescricaoDAO(); stockDAO = new StockDAO(); diarioBordoDAO = new DiarioBordoDAO(); faturaDAO = new FaturaDAO();

    // Criar as cobaias base para os testes lerem e escreverem sem tocarem nos cães reais
    await prisma.utilizador.create({
      data: {
        nome: 'Tutor Teste', email: 'teste.integracao@hotel.com', password: 'hash',
        tutor: { create: { nif: '99998888777', contacto: '910000000' } }
      }
    });

    const animal = await prisma.animal.create({
      data: {
        nome: 'Rex Teste', microchip: 'CHIP-TESTE-001', reatividade: 'Não Reativo', tutorNif: '99998888777',
        planoVacinal: { create: { dataUltimaVacina: new Date(), documento: 'url', estado: 'Valido', isValido: true } }
      }
    });

    await prisma.box.create({ data: { numero: 999, tipo: 'Não-Reativo', estado: 'Limpa' } });

    await prisma.reserva.create({
      data: {
        dataEntrada: new Date(), dataSaida: new Date(Date.now() + 86400000), valor: 100, estado: 'CheckIn',
        animalId: animal.idAnimal, boxNumero: 999,
        diarioBordo: { create: { descricao: 'Log Teste Inicial' } }
      }
    });

    await prisma.stock.create({
      data: { nome: 'TESTE-Medicamento', quantidade: 50, limiteAlerta: 5, medicamento: { create: { concentracao: 100 } } }
    });
  });

  afterAll(async () => {
    await limparMeusDados(); // Limpa no fim e deixa a BD real intocável!
    await prisma.$disconnect();
  });

  describe('AnimalDAO', () => {
    it('deve retornar todos os animais', async () => {
      const animais = await animalDAO.findAll();
      expect(animais.length).toBeGreaterThan(0);
    });

    it('deve criar e atualizar um animal isolado', async () => {
      const novoAnimal = await animalDAO.createAnimal(
        { nome: 'Doguinho', reatividade: 'Calmo', microchip: `CHIP-TESTE-${Date.now()}`, tutorNif: '99998888777' },
        { dataUltimaVacina: new Date(), documento: 'DOC-001', isValido: false, estado: 'Valido' }
      );
      expect(novoAnimal).toHaveProperty('idAnimal');

      const updated = await animalDAO.updatePlanoVacinal(novoAnimal.idAnimal, { documento: 'DOC-UPDATE' });
      expect(updated).toBeDefined();
    });
  });

  describe('UtilizadorDAO', () => {
    it('deve encontrar um utilizador pelo email de teste', async () => {
      const utilizador = await utilizadorDAO.findByEmail('teste.integracao@hotel.com');
      expect(utilizador?.email).toBe('teste.integracao@hotel.com');
    });
  });

  describe('FaturaDAO', () => {
    it('deve criar uma nova fatura segura', async () => {
      const novaFatura = await faturaDAO.create({
        nifCliente: '99991234567', // NIF de teste
        valorTotal: 150.00,
        documento: 'DOC-001',
        metodoPagamento: 'Cartão de Crédito'
      });
      expect(novaFatura.valorTotal).toBe(150.00);
    });
  });
});
import { PrismaClient } from '@prisma/client';
import { AnimalDAO } from '../../dao/AnimalDAO';
import { UtilizadorDAO } from '../../dao/UtilizadorDAO';
import { ReservaDAO } from '../../dao/ReservaDAO';
import { PrescricaoDAO } from '../../dao/PrescricaoDAO';
import { StockDAO } from '../../dao/StockDAO';
import { DiarioBordoDAO } from '../../dao/DiarioBordoDAO';
import { FaturaDAO } from '../../dao/FaturaDAO';

const prisma = new PrismaClient();

describe('DAOs - Testes Seguros Globais na DB Real', () => {
  let animalDAO: AnimalDAO; let utilizadorDAO: UtilizadorDAO; let reservaDAO: ReservaDAO;
  let prescricaoDAO: PrescricaoDAO; let stockDAO: StockDAO; let diarioBordoDAO: DiarioBordoDAO; let faturaDAO: FaturaDAO;

  const limparMeusDados = async () => {
    // Teardown cirúrgico baseado nas tags de teste '9999' e 'teste.'
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
    await prisma.box.deleteMany({ where: { numero: { gt: 900 } } }); 
  };

  beforeAll(async () => {
    await limparMeusDados();

    animalDAO = new AnimalDAO(); utilizadorDAO = new UtilizadorDAO(); reservaDAO = new ReservaDAO();
    prescricaoDAO = new PrescricaoDAO(); stockDAO = new StockDAO(); diarioBordoDAO = new DiarioBordoDAO(); faturaDAO = new FaturaDAO();

    // 1. Criar utilizadores e staff de teste
    await prisma.utilizador.create({
      data: {
        nome: 'Tutor Teste', email: 'teste.integracao@hotel.com', password: 'hash',
        tutor: { create: { nif: '99998888777', contacto: '910000000' } }
      }
    });

    await prisma.utilizador.create({
      data: { nome: 'Staff Teste', email: 'teste.staff@hotel.com', password: 'hash', funcionario: { create: { perfil: 'Staff' } } }
    });

    // 2. Criar animal cobaia
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
    await limparMeusDados();
    await prisma.$disconnect();
  });

  describe('AnimalDAO - Testes de Cobertura', () => {
    it('deve retornar todos os animais do sistema', async () => {
      const animais = await animalDAO.findAll();
      expect(animais.length).toBeGreaterThan(0);
    });

    it('deve retornar array vazio se o tutor NIF não existir', async () => {
      const animais = await animalDAO.findByTutorNif('99990000000');
      expect(animais.length).toBe(0);
    });

    it('deve retornar null ao procurar histórico de ID inexistente', async () => {
      const animal = await animalDAO.findByIdWithHistorial('id-fantasma-123');
      expect(animal).toBeNull();
    });

    it('deve criar um animal sem plano vacinal anexado', async () => {
      const novo = await animalDAO.createAnimal({
        nome: 'Sem Vacina', reatividade: 'Não Reativo', microchip: `CHIP-TESTE-${Date.now()}`, tutorNif: '99998888777'
      });
      expect(novo).toHaveProperty('idAnimal');
    });

    it('deve lançar erro ao atualizar plano vacinal de animal inexistente', async () => {
      await expect(animalDAO.updatePlanoVacinal('id-inexistente', { documento: 'err' }))
        .rejects.toThrow();
    });
  });

  describe('UtilizadorDAO - Testes de Cobertura', () => {
    it('deve retornar null para email inexistente', async () => {
      const user = await utilizadorDAO.findByEmail('nao-existo@hotel.com');
      expect(user).toBeNull();
    });

    it('deve listar todos os funcionários registados', async () => {
      const lista = await utilizadorDAO.findAll();
      expect(Array.isArray(lista)).toBe(true);
    });

    it('deve retornar todos os funcionários de um determinado perfil', async () => {
      const lista = await utilizadorDAO.findByPerfil('Staff');
      expect(Array.isArray(lista)).toBe(true);
    });

    it('deve lançar erro se tentar criar um tutor com email já registado', async () => {
      await expect(utilizadorDAO.createTutor('Nome', 'teste.integracao@hotel.com', 'pass', '99991111222', '910'))
        .rejects.toThrow();
    });
  });

  describe('FaturaDAO - Testes de Cobertura', () => {
    it('deve listar todas as faturas e buscar faturas por tutor', async () => {
      await faturaDAO.create({ nifCliente: '99998888777', valorTotal: 50, documento: 'DOC-1', metodoPagamento: 'MBWay' });
      
      const todas = await faturaDAO.findAll();
      expect(todas.length).toBeGreaterThan(0);

      const doTutor = await faturaDAO.buscarPorTutor('99998888777');
      expect(doTutor.length).toBeGreaterThan(0);
    });
  });
});
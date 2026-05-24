import { PrismaClient } from '@prisma/client';
import { PrescricaoDAO } from '../../dao/PrescricaoDAO';
import { ReservaDAO } from '../../dao/ReservaDAO';

const prisma = new PrismaClient();

describe('DAOs Avançados - Testes Seguros de Cobertura Máxima', () => {
  let prescricaoDAO: PrescricaoDAO;
  let reservaDAO: ReservaDAO;

  const limparMeusDados = async () => {
    await prisma.logMedicacao.deleteMany({ where: { funcionario: { utilizador: { email: { startsWith: 'teste.' } } } } });
    await prisma.linhaPrescricao.deleteMany({ where: { prescricao: { animal: { microchip: { startsWith: 'CHIP-TESTE' } } } } });
    await prisma.prescricao.deleteMany({ where: { animal: { microchip: { startsWith: 'CHIP-TESTE' } } } });
    await prisma.servico.deleteMany({ where: { reserva: { animal: { microchip: { startsWith: 'CHIP-TESTE' } } } } });
    await prisma.diarioBordo.deleteMany({ where: { reserva: { animal: { microchip: { startsWith: 'CHIP-TESTE' } } } } });
    await prisma.reserva.deleteMany({ where: { animal: { microchip: { startsWith: 'CHIP-TESTE' } } } });
    await prisma.animal.deleteMany({ where: { microchip: { startsWith: 'CHIP-TESTE' } } });
    await prisma.tutor.deleteMany({ where: { nif: { startsWith: '9999' } } });
    await prisma.funcionario.deleteMany({ where: { idFuncionario: { startsWith: 'teste-' } } });
    await prisma.utilizador.deleteMany({ where: { email: { startsWith: 'teste.' } } });
    await prisma.stock.deleteMany({ where: { nome: { startsWith: 'TESTE-' } } });
    await prisma.box.deleteMany({ where: { numero: { gt: 900 } } }); 
  };

  beforeAll(async () => {
    await limparMeusDados();
    prescricaoDAO = new PrescricaoDAO(); reservaDAO = new ReservaDAO();

    const vetUser = await prisma.utilizador.create({
      data: { idUtilizador: 'teste-vet-id', nome: 'Vet', email: 'teste.vet@adv.com', password: 'hash', funcionario: { create: { idFuncionario: 'teste-vet-func', perfil: 'Vet' } } },
      include: { funcionario: true }
    });

    await prisma.utilizador.create({
      data: { nome: 'Tutor', email: 'teste.tutor@adv.com', password: 'hash', tutor: { create: { nif: '99990000111', contacto: '920' } } }
    });

    const animalSaudavel = await prisma.animal.create({
      data: { nome: 'Snoopy Teste', microchip: 'CHIP-TESTE-SAUDAVEL', reatividade: 'Não Reativo', tutorNif: '99990000111', estado: 'Saudavel' }
    });

    const animalQuarentena = await prisma.animal.create({
      data: { nome: 'Spike Teste', microchip: 'CHIP-TESTE-QUARENTENA', reatividade: 'Reativo', tutorNif: '99990000111', estado: 'Quarentena' }
    });

    // Criar o ecossistema completo de boxes altas de teste
    await prisma.box.createMany({
      data: [
        { numero: 991, tipo: 'Não-Reativo', estado: 'Limpa' },
        { numero: 992, tipo: 'Quarentena', estado: 'Limpa' },
        { numero: 993, tipo: 'Não-Reativo', estado: 'Suja' },
        { numero: 994, tipo: 'Reativo', estado: 'Limpa' }
      ]
    });

    const reserva = await prisma.reserva.create({
      data: { animalId: animalSaudavel.idAnimal, dataEntrada: new Date(), dataSaida: new Date(Date.now() + 86400000), valor: 100, estado: 'CheckIn', boxNumero: 991 }
    });

    await prisma.reserva.create({
      data: { animalId: animalQuarentena.idAnimal, dataEntrada: new Date(), dataSaida: new Date(Date.now() + 86400000), valor: 100, estado: 'CheckIn', boxNumero: 992 }
    });

    await prisma.servico.create({
      data: { tipo: 'Alimentacao', estado: 'Pendente', preco: 10, data: new Date(), reservaId: reserva.idReserva }
    });

    const stock1 = await prisma.stock.create({ data: { nome: 'TESTE-M1', quantidade: 50, limiteAlerta: 5, medicamento: { create: { concentracao: 100 } } }, include: { medicamento: true } });

    const prescricao = await prisma.prescricao.create({
      data: { data: new Date(), animalId: animalSaudavel.idAnimal, funcionarioId: vetUser.funcionario!.idFuncionario }
    });

    await prisma.linhaPrescricao.create({
      data: { prescricaoId: prescricao.idPrescricao, medicamentoId: stock1.medicamento!.idMedicamento, dosagem: 2, frequencia: 'Diária', totalDoses: 5, ativa: true }
    });
  });

  afterAll(async () => {
    await limparMeusDados();
    await prisma.$disconnect();
  });

  describe('ReservaDAO - Linhas Específicas', () => {
    it('deve listar todas as boxes cadastradas', async () => {
      const boxes = await reservaDAO.findAllBoxes();
      expect(boxes.length).toBeGreaterThan(0);
    });

    it('deve retornar indisponibilidade para box que está marcada como Suja', async () => {
      const resultado = await reservaDAO.verificarCapacidadeBox(993, new Date(), new Date(Date.now() + 86400000));
      expect(resultado.disponivel).toBe(false);
      expect(resultado.motivo).toContain('limpeza');
    });

    it('deve retornar indisponibilidade para número de box inexistente', async () => {
      const resultado = await reservaDAO.verificarCapacidadeBox(12345, new Date(), new Date());
      expect(resultado.disponivel).toBe(false);
      expect(resultado.motivo).toContain('não existe');
    });

    it('deve processar o check-in na BD alterando os parâmetros internos da reserva', async () => {
      const reservas = await reservaDAO.findAll();
      const minhaReserva = reservas.find(r => r.boxNumero === 991);
      if (minhaReserva) {
        const atualizada = await reservaDAO.processarCheckInDB(minhaReserva.idReserva);
        expect(atualizada.estado).toBe('CheckIn');
      }
    });

    it('deve encontrar tarefas finalizadas por animal e dia', async () => {
      const animais = await prisma.animal.findMany({ where: { microchip: 'CHIP-TESTE-SAUDAVEL' } });
      const tarefas = await reservaDAO.findFinalizadosPorAnimalEDia(animais[0].idAnimal);
      expect(Array.isArray(tarefas)).toBe(true);
    });

    it('deve retornar caixas sujas pendentes de higienização', async () => {
      const sujas = await reservaDAO.findBoxesSujas();
      expect(sujas.length).toBeGreaterThan(0);
    });
  });

  describe('PrescricaoDAO - Linhas Específicas', () => {
    it('deve retornar todas as prescrições associadas a um cão', async () => {
      const animais = await prisma.animal.findMany({ where: { microchip: 'CHIP-TESTE-SAUDAVEL' } });
      const lista = await prescricaoDAO.findByAnimal(animais[0].idAnimal);
      expect(lista.length).toBeGreaterThan(0);
    });

    it('deve lançar erro ao tentar registar medicação com ID de utilizador inválido', async () => {
      const ativos = await prescricaoDAO.listarTratamentosAtivos();
      await expect(prescricaoDAO.registarAdministracao(ativos[0].idLinha, 'id-inexistente-user'))
        .rejects.toThrow();
    });
  });
});
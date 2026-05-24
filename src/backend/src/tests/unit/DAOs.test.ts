import { PrismaClient } from '@prisma/client';
import { PrescricaoDAO } from '../../dao/PrescricaoDAO';
import { ReservaDAO } from '../../dao/ReservaDAO';

const prisma = new PrismaClient();

describe('DAOs Avançados - Testes Seguros na DB Real', () => {
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
    await prisma.funcionario.deleteMany({ where: { utilizador: { email: { startsWith: 'teste.' } } } });
    await prisma.utilizador.deleteMany({ where: { email: { startsWith: 'teste.' } } });
    await prisma.stock.deleteMany({ where: { nome: { startsWith: 'TESTE-' } } });
    await prisma.box.deleteMany({ where: { numero: { gt: 900 } } }); 
  };

  beforeAll(async () => {
    await limparMeusDados();
    prescricaoDAO = new PrescricaoDAO(); reservaDAO = new ReservaDAO();

    // Criar as "Cobaias" exclusivas deste teste
    const vetUser = await prisma.utilizador.create({
      data: { nome: 'Vet', email: 'teste.vet@adv.com', password: 'hash', funcionario: { create: { perfil: 'Vet' } } },
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

    await prisma.box.createMany({
      data: [
        { numero: 991, tipo: 'Não-Reativo', estado: 'Limpa' },
        { numero: 992, tipo: 'Quarentena', estado: 'Limpa' },
        { numero: 993, tipo: 'Não-Reativo', estado: 'Suja' } // Box suja de teste
      ]
    });

    const reserva = await prisma.reserva.create({
      data: { animalId: animalSaudavel.idAnimal, dataEntrada: new Date(), dataSaida: new Date(Date.now() + 86400000), valor: 100, estado: 'CheckIn', boxNumero: 991 }
    });

    await prisma.reserva.create({
      data: { animalId: animalQuarentena.idAnimal, dataEntrada: new Date(), dataSaida: new Date(Date.now() + 86400000), valor: 100, estado: 'CheckIn', boxNumero: 992 }
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

  describe('ReservaDAO Avançado', () => {
    it('deve marcar box de teste como limpa', async () => {
      await reservaDAO.marcarBoxComoLimpa(993); 
      const box = await prisma.box.findUnique({ where: { numero: 993 } });
      expect(box?.estado).toBe('Limpa');
    });

    it('deve atribuir box automaticamente nas boxes de teste (Não Reativo)', async () => {
      const hoje = new Date();
      const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
      const numeroBox = await reservaDAO.atribuirBoxAutomaticamente('Não Reativo', hoje, amanha);
      expect(numeroBox).toBeGreaterThan(0);
    });
  });

  describe('PrescricaoDAO', () => {
    it('deve identificar caes sem check diario e altera-los', async () => {
      // Como a query traz todos, filtramos só pelo nosso de teste
      const caes = await prescricaoDAO.listarCaesParaVerificar();
      const caoTeste = caes.find(c => c.microchip === 'CHIP-TESTE-SAUDAVEL');
      
      if (caoTeste) {
        expect(caoTeste.check).toBe(false);
        const registo = await prescricaoDAO.registarCheckDiario(caoTeste.idAnimal, 'Tudo bem', 'Dr. Vet');
        expect(registo?.descricao).toContain('CHECK CLÍNICO');
      }
    });

    it('deve transitar estados de quarentena de forma segura', async () => {
      const animal = await prisma.animal.findUnique({ where: { microchip: 'CHIP-TESTE-SAUDAVEL' } });
      
      if (animal) {
        // Ativar
        await prescricaoDAO.ativarQuarentena(animal.idAnimal, 'Suspeita');
        let status = await prisma.animal.findUnique({ where: { idAnimal: animal.idAnimal } });
        expect(status?.estado).toBe('Quarentena');

        // Desativar
        await prescricaoDAO.desativarQuarentena(animal.idAnimal);
        status = await prisma.animal.findUnique({ where: { idAnimal: animal.idAnimal } });
        expect(status?.estado).toBe('Saudavel');
      }
    });
  });
});
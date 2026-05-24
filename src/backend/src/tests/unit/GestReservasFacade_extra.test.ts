// Mock do @prisma/client ANTES de qualquer import que o use.
// Isto intercepta o `const prisma = new PrismaClient()` no DiarioBordoDAO
// que é instanciado localmente dentro de marcarTarefaConcluida.
const mockFindFirst = jest.fn();
const mockDiarioBordoCreate = jest.fn().mockResolvedValue({ idDiario: 'diario-mock' });

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      reserva: {
        findFirst: mockFindFirst,
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      diarioBordo: {
        create: mockDiarioBordoCreate,
        findMany: jest.fn(),
      },
      servico: { findUnique: jest.fn(), update: jest.fn() },
      box: { findMany: jest.fn(), update: jest.fn() },
      animal: { findUnique: jest.fn() },
      faturas: { create: jest.fn() },
    }))
  };
});

import { GestReservasFacade } from '../../core/GestReservasFacade';

describe('GestReservasFacade - Testes Adicionais (Cobertura Extra)', () => {
  let facade: GestReservasFacade;
  let mockReservaDAO: any;
  let mockFaturaDAO: any;

  const criarReservaMock = (diasEntradaAtras: number, diasSaidaFuturos: number, valor = 100) => {
    const entrada = new Date();
    entrada.setDate(entrada.getDate() - diasEntradaAtras);
    const saida = new Date();
    saida.setDate(saida.getDate() + diasSaidaFuturos);
    return {
      idReserva: 'reserva-teste', valor,
      dataEntrada: entrada.toISOString(),
      dataSaida: saida.toISOString(),
      animal: { tutorNif: '123456789' }
    };
  };

  beforeEach(() => {
    mockFindFirst.mockClear();
    mockDiarioBordoCreate.mockClear();

    facade = new GestReservasFacade();

    mockReservaDAO = (facade as any).reservaDAO;
    mockFaturaDAO  = (facade as any).faturaDAO;

    mockReservaDAO.findByIdComAnimal    = jest.fn();
    mockReservaDAO.processarCheckOutDB  = jest.fn();
    mockReservaDAO.updateEstado         = jest.fn();
    mockReservaDAO.delete               = jest.fn();
    mockReservaDAO.findAll              = jest.fn();
    mockReservaDAO.findTarefasDoDia     = jest.fn();
    mockReservaDAO.findTarefasPendentes = jest.fn();
    mockReservaDAO.findById             = jest.fn();
    mockReservaDAO.marcarConcluida      = jest.fn();
    mockReservaDAO.findBoxesSujas       = jest.fn();
    mockReservaDAO.marcarBoxComoLimpa   = jest.fn();
    mockFaturaDAO.create                = jest.fn();
  });

  // ============================================================
  // processarCheckOutCompleto — lógica de ajuste de valor
  // ============================================================
  describe('Método: processarCheckOutCompleto — ajuste de valor', () => {

    it('não deve ajustar o valor quando o check-out ocorre exatamente no dia previsto', async () => {
      const reserva = criarReservaMock(2, 0, 100);
      mockReservaDAO.findByIdComAnimal.mockResolvedValue(reserva);
      mockFaturaDAO.create.mockImplementation((d: any) => Promise.resolve({ ...d, idFaturas: 'f-1' }));
      mockReservaDAO.processarCheckOutDB.mockResolvedValue({});

      const resultado = await facade.processarCheckOutCompleto('reserva-teste', 'MBWay');

      expect(resultado.valorOriginal).toBe(100);
      expect(resultado.valorFinal).toBe(100);
    });

    it('deve cobrar 20€ por cada dia extra quando o check-out ocorre depois da saída prevista', async () => {
      const entrada = new Date(); entrada.setDate(entrada.getDate() - 5);
      const saida = new Date();   saida.setDate(saida.getDate() - 2);
      const reserva = {
        idReserva: 'reserva-teste', valor: 100,
        dataEntrada: entrada.toISOString(), dataSaida: saida.toISOString(),
        animal: { tutorNif: '123456789' }
      };
      mockReservaDAO.findByIdComAnimal.mockResolvedValue(reserva);
      mockFaturaDAO.create.mockImplementation((d: any) => Promise.resolve({ ...d, idFaturas: 'f-2' }));
      mockReservaDAO.processarCheckOutDB.mockResolvedValue({});

      const resultado = await facade.processarCheckOutCompleto('reserva-teste', 'Cartao');

      expect(resultado.valorFinal).toBe(140);
    });

    it('deve descontar 20€ por cada dia antecipado quando o check-out ocorre antes da saída prevista', async () => {
      const reserva = criarReservaMock(1, 3, 100);
      mockReservaDAO.findByIdComAnimal.mockResolvedValue(reserva);
      mockFaturaDAO.create.mockImplementation((d: any) => Promise.resolve({ ...d, idFaturas: 'f-3' }));
      mockReservaDAO.processarCheckOutDB.mockResolvedValue({});

      const resultado = await facade.processarCheckOutCompleto('reserva-teste', 'Numerario');

      expect(resultado.valorFinal).toBe(40);
    });

    it('não deve devolver valor negativo mesmo com desconto superior ao valor original', async () => {
      const reserva = criarReservaMock(1, 10, 10);
      mockReservaDAO.findByIdComAnimal.mockResolvedValue(reserva);
      mockFaturaDAO.create.mockImplementation((d: any) => Promise.resolve({ ...d, idFaturas: 'f-4' }));
      mockReservaDAO.processarCheckOutDB.mockResolvedValue({});

      const resultado = await facade.processarCheckOutCompleto('reserva-teste', 'MBWay');

      expect(resultado.valorFinal).toBe(0);
    });

    it('deve criar a fatura com o método de pagamento correto e chamar processarCheckOutDB', async () => {
      const reserva = criarReservaMock(2, 0, 80);
      mockReservaDAO.findByIdComAnimal.mockResolvedValue(reserva);
      mockFaturaDAO.create.mockResolvedValue({ idFaturas: 'f-5', metodoPagamento: 'MBWay', valorTotal: 80 });
      mockReservaDAO.processarCheckOutDB.mockResolvedValue({});

      await facade.processarCheckOutCompleto('reserva-teste', 'MBWay');

      expect(mockFaturaDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({ metodoPagamento: 'MBWay', nifCliente: '123456789' })
      );
      expect(mockReservaDAO.processarCheckOutDB)
        .toHaveBeenCalledWith('reserva-teste', expect.any(Number), 'f-5');
    });
  });

  // ============================================================
  // marcarTarefaConcluida
  // ============================================================
  describe('Método: marcarTarefaConcluida', () => {

    it('deve lançar erro se a tarefa não existir', async () => {
      mockReservaDAO.findById.mockResolvedValue(null);

      await expect(facade.marcarTarefaConcluida('tarefa-inexistente'))
        .rejects.toThrow('Tarefa não encontrada.');
    });

    it('deve marcar como concluída e criar entrada no diário sem foto', async () => {
      mockReservaDAO.findById.mockResolvedValue({ idServico: 'srv-1' });
      mockReservaDAO.marcarConcluida.mockResolvedValue({
        idServico: 'srv-1', tipo: 'Alimentacao',
        reserva: { animalId: 'animal-abc' }
      });
      // Simular que o animal tem reserva ativa (necessário para DiarioBordoDAO.create)
      mockFindFirst.mockResolvedValue({ idReserva: 'reserva-ativa' });

      const resultado = await facade.marcarTarefaConcluida('srv-1', 'João');

      expect(resultado.tipo).toBe('Alimentacao');
      expect(mockReservaDAO.marcarConcluida).toHaveBeenCalledWith('srv-1');
      // prisma.diarioBordo.create é chamado internamente com { data: { fotos: [], ... } }
      expect(mockDiarioBordoCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ fotos: [] }) })
      );
    });

    it('deve criar entrada no diário com a foto quando fotoUrl é fornecido', async () => {
      mockReservaDAO.findById.mockResolvedValue({ idServico: 'srv-3' });
      mockReservaDAO.marcarConcluida.mockResolvedValue({
        idServico: 'srv-3', tipo: 'Banho',
        reserva: { animalId: 'animal-abc' }
      });
      mockFindFirst.mockResolvedValue({ idReserva: 'reserva-ativa' });

      await facade.marcarTarefaConcluida('srv-3', 'Maria', 'https://foto.jpg');

      expect(mockDiarioBordoCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ fotos: ['https://foto.jpg'] }) })
      );
    });

    it('não deve tentar criar entrada no diário quando a tarefa não tem animalId', async () => {
      mockReservaDAO.findById.mockResolvedValue({ idServico: 'srv-2' });
      mockReservaDAO.marcarConcluida.mockResolvedValue({
        idServico: 'srv-2', tipo: 'Grooming',
        reserva: null
      });

      const resultado = await facade.marcarTarefaConcluida('srv-2', 'Maria');

      expect(resultado.tipo).toBe('Grooming');
      expect(mockDiarioBordoCreate).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Métodos de delegação simples
  // ============================================================
  describe('Métodos de delegação simples', () => {

    it('cancelarReserva deve chamar updateEstado com "Cancelada"', async () => {
      mockReservaDAO.updateEstado.mockResolvedValue({ estado: 'Cancelada' });

      const resultado = await facade.cancelarReserva('reserva-1');

      expect(resultado.estado).toBe('Cancelada');
      expect(mockReservaDAO.updateEstado).toHaveBeenCalledWith('reserva-1', 'Cancelada');
    });

    it('eliminarReserva deve chamar delete no DAO', async () => {
      mockReservaDAO.delete.mockResolvedValue({ deleted: true });

      const resultado = await facade.eliminarReserva('reserva-2');

      expect(resultado).toBeDefined();
      expect(mockReservaDAO.delete).toHaveBeenCalledWith('reserva-2');
    });

    it('listarTodas deve retornar a lista de reservas do DAO', async () => {
      mockReservaDAO.findAll.mockResolvedValue([{ idReserva: 'r-1' }, { idReserva: 'r-2' }]);

      const resultado = await facade.listarTodas();

      expect(resultado).toHaveLength(2);
    });

    it('listarTarefasDoDia deve retornar as tarefas do DAO', async () => {
      mockReservaDAO.findTarefasDoDia.mockResolvedValue([{ idServico: 'srv-10' }]);

      const resultado = await facade.listarTarefasDoDia();

      expect(resultado).toHaveLength(1);
    });

    it('listarBoxesSujas deve retornar as boxes sujas do DAO', async () => {
      mockReservaDAO.findBoxesSujas.mockResolvedValue([{ numero: 3 }, { numero: 7 }]);

      const resultado = await facade.listarBoxesSujas();

      expect(resultado).toHaveLength(2);
    });

    it('limparBox deve chamar marcarBoxComoLimpa com o número correto', async () => {
      mockReservaDAO.marcarBoxComoLimpa.mockResolvedValue({ numero: 3, estado: 'Limpa' });

      const resultado = await facade.limparBox(3);

      expect(resultado.estado).toBe('Limpa');
      expect(mockReservaDAO.marcarBoxComoLimpa).toHaveBeenCalledWith(3);
    });
  });
});
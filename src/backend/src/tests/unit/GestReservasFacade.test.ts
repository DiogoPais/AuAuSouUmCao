import { GestReservasFacade } from '../../core/GestReservasFacade';

describe('GestReservasFacade - Testes Unitários', () => {
  let facade: GestReservasFacade;
  
  let mockReservaDAO: any;
  let mockAnimalDAO: any;
  let mockUtilizadorDAO: any;
  let mockFaturaDAO: any;

  beforeEach(() => {
    // 1. Instanciar a Facade real
    facade = new GestReservasFacade();

    // 2. Extrair as instâncias dos DAOs criadas no constructor para podermos espiar
    mockReservaDAO = (facade as any).reservaDAO;
    mockAnimalDAO = (facade as any).animalDAO;
    mockUtilizadorDAO = (facade as any).utilizadorDAO;
    mockFaturaDAO = (facade as any).faturaDAO;

    // 3. Substituir os métodos reais por Mocks (jest.fn)
    mockAnimalDAO.findByIdWithHistorial = jest.fn();
    mockReservaDAO.findReservaAtivaDoAnimal = jest.fn();
    mockReservaDAO.atribuirBoxAutomaticamente = jest.fn();
    mockUtilizadorDAO.findByPerfil = jest.fn();
    mockReservaDAO.create = jest.fn();
    
    mockReservaDAO.processarCheckInDB = jest.fn();
    
    mockReservaDAO.findByIdComAnimal = jest.fn();
    mockFaturaDAO.create = jest.fn();
    mockReservaDAO.processarCheckOutDB = jest.fn();
  });

  describe('Método: criarReserva', () => {
    
    // 1. Caminho Feliz
    it('deve criar uma reserva com sucesso quando os dados e as datas são válidos', async () => {
      const dadosReserva = {
        animalId: 'animal-123',
        dataEntrada: new Date('2026-06-01T10:00:00Z'),
        dataSaida: new Date('2026-06-05T10:00:00Z'),
        valor: 150,
        banhos: 1
      };

      // Simula que encontra o animal com reatividade
      mockAnimalDAO.findByIdWithHistorial.mockResolvedValue({ idAnimal: 'animal-123', reatividade: 'Não Reativo' });
      // Simula que não há reserva ativa
      mockReservaDAO.findReservaAtivaDoAnimal.mockResolvedValue(null);
      // Simula atribuição de box
      mockReservaDAO.atribuirBoxAutomaticamente.mockResolvedValue(5);
      // Simula staff disponível para associar tarefas
      mockUtilizadorDAO.findByPerfil.mockResolvedValue([{ idFuncionario: 'staff-1' }]);
      
      // CORREÇÃO: O mock agora retorna "idReservas" condizente com o vosso Prisma Schema
      mockReservaDAO.create.mockResolvedValue({ 
        idReserva: 'reserva-999', 
        ...dadosReserva, 
        estado: 'Pendente',
        boxNumero: 5,
        box: { numero: 5, tipo: 'Normal', estado: 'Disponivel' },
        animal: { idAnimal: 'animal-123', nome: 'Bobby', tutorNif: '123456789' },
        servicos: []
      });

      const resultado = await facade.criarReserva(dadosReserva);

      expect(resultado).toBeDefined();
      // CORREÇÃO: Asserção alterada para verificar a propriedade real da vossa tabela
      expect(resultado.idReserva).toBe('reserva-999');
      expect(mockReservaDAO.create).toHaveBeenCalledTimes(1);
    });

    // 2. Edge Case: dataSaida igual a dataEntrada
    it('deve lançar erro "Datas inválidas" quando dataSaida é igual a dataEntrada', async () => {
      const dadosInvalidos = {
        animalId: 'animal-123',
        dataEntrada: new Date('2026-06-01T10:00:00Z'),
        dataSaida: new Date('2026-06-01T10:00:00Z')
      };

      await expect(facade.criarReserva(dadosInvalidos)).rejects.toThrow('Datas inválidas');
      expect(mockReservaDAO.create).not.toHaveBeenCalled();
    });

    // 3. Caminho Triste: dataSaida anterior a dataEntrada
    it('deve lançar erro "Datas inválidas" quando dataSaida é anterior a dataEntrada', async () => {
      const dadosInvalidos = {
        animalId: 'animal-123',
        dataEntrada: new Date('2026-06-05T10:00:00Z'),
        dataSaida: new Date('2026-06-01T10:00:00Z')
      };

      await expect(facade.criarReserva(dadosInvalidos)).rejects.toThrow('Datas inválidas');
    });

    // 4. Caminho Triste: animalId inexistente
    it('deve lançar erro "Animal não encontrado" se o animal não existir na DB', async () => {
      const dados = {
        animalId: 'animal-inexistente',
        dataEntrada: new Date('2026-06-01T10:00:00Z'),
        dataSaida: new Date('2026-06-05T10:00:00Z')
      };

      mockAnimalDAO.findByIdWithHistorial.mockResolvedValue(null);

      await expect(facade.criarReserva(dados)).rejects.toThrow('Animal não encontrado');
      expect(mockReservaDAO.create).not.toHaveBeenCalled();
    });

    // 5. Caminho Triste: Animal com reserva ativa
    it('deve lançar erro se o animal já possuir uma reserva ativa', async () => {
      const dados = {
        animalId: 'animal-bobby',
        dataEntrada: new Date('2026-06-01T10:00:00Z'),
        dataSaida: new Date('2026-06-05T10:00:00Z')
      };

      mockAnimalDAO.findByIdWithHistorial.mockResolvedValue({ idAnimal: 'animal-bobby' });
      mockReservaDAO.findReservaAtivaDoAnimal.mockResolvedValue({ idReservas: 'reserva-existente', estado: 'CheckIn' });

      await expect(facade.criarReserva(dados)).rejects.toThrow('já possui uma reserva ativa');
      expect(mockReservaDAO.create).not.toHaveBeenCalled();
    });
  });

  describe('Método: confirmarCheckIn', () => {
    
    // 1. Caminho Feliz: Termos aceites
    it('deve processar o check-in com sucesso quando os termos são aceites', async () => {
      mockReservaDAO.processarCheckInDB.mockResolvedValue({ idReservas: 'reserva-1', estado: 'CheckIn' });

      const resultado = await facade.confirmarCheckIn('reserva-1', true);

      expect(resultado).toBeDefined();
      expect(resultado.estado).toBe('CheckIn');
      expect(mockReservaDAO.processarCheckInDB).toHaveBeenCalledWith('reserva-1');
    });

    // 2. Caminho Triste: Termos recusados
    it('deve lançar um erro sobre obrigatoriedade se termosAceites for falso', async () => {
      await expect(facade.confirmarCheckIn('reserva-1', false)).rejects.toThrow('obrigatória');
      expect(mockReservaDAO.processarCheckInDB).not.toHaveBeenCalled();
    });
  });

  describe('Método: processarCheckOutCompleto', () => {
    
    // 1. Caminho Triste: Método de pagamento ausente
    it('deve lançar erro se o método de pagamento não for passado', async () => {
      await expect(facade.processarCheckOutCompleto('reserva-1', '')).rejects.toThrow('obrigatório selecionar um método de pagamento');
    });

    // 2. Caminho Triste: Reserva não encontrada
    it('deve lançar erro se a reserva a fechar não for encontrada', async () => {
      mockReservaDAO.findByIdComAnimal.mockResolvedValue(null);

      await expect(facade.processarCheckOutCompleto('reserva-invalida', 'Cartao')).rejects.toThrow('Reserva não encontrada');
    });
  });
});


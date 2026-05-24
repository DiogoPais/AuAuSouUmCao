import { GestHospedesFacade } from '../../core/GestHospedesFacade';

describe('GestHospedesFacade - Testes Unitários', () => {
  let facade: GestHospedesFacade;
  
  let mockUtilizadorDAO: any;
  let mockAnimalDAO: any;

  beforeEach(() => {
    facade = new GestHospedesFacade();

    mockUtilizadorDAO = (facade as any).utilizadorDAO;
    mockAnimalDAO = (facade as any).animalDAO;

    // Espiar os métodos reais de acordo com a tua Facade
    mockUtilizadorDAO.findByEmail = jest.fn();
    mockUtilizadorDAO.createTutor = jest.fn();
    
    mockAnimalDAO.createAnimal = jest.fn();
    mockAnimalDAO.findByIdWithHistorial = jest.fn();
    mockAnimalDAO.updatePlanoVacinal = jest.fn();
  });

  describe('Método: criarContaTutor', () => {
    
    // 1. Caminho Feliz (Agora passando os 5 argumentos separados)
    it('deve criar uma nova conta de tutor com sucesso quando o email é válido e novo', async () => {
      mockUtilizadorDAO.findByEmail.mockResolvedValue(null);
      mockUtilizadorDAO.createTutor.mockResolvedValue({ idUtilizador: 'tutor-1', nome: 'João' });

      const resultado = await facade.criarContaTutor('João', 'joao@email.com', 'pwd_hash_123', '123456789', '912345678');

      expect(resultado).toBeDefined();
      expect(resultado.idUtilizador).toBe('tutor-1');
      expect(mockUtilizadorDAO.findByEmail).toHaveBeenCalledWith('joao@email.com');
      expect(mockUtilizadorDAO.createTutor).toHaveBeenCalledWith('João', 'joao@email.com', 'pwd_hash_123', '123456789', '912345678');
    });

    // 2. Caminho Triste: Email sem @
    it('deve lançar erro se o email não possuir um formato válido (ex: sem @)', async () => {
      await expect(
        facade.criarContaTutor('João', 'joaoemail.com', 'pwd_hash_123', '123456789', '912345678')
      ).rejects.toThrow('Formato de email inválido.');
      
      expect(mockUtilizadorDAO.createTutor).not.toHaveBeenCalled();
    });

    // 3. Caminho Triste: Email já existe
    it('deve lançar erro se já existir uma conta registada com o mesmo email', async () => {
      mockUtilizadorDAO.findByEmail.mockResolvedValue({ idUtilizador: 'tutor-existente', email: 'maria@email.com' });

      await expect(
        facade.criarContaTutor('Maria', 'maria@email.com', 'pwd_hash_123', '987654321', '912345678')
      ).rejects.toThrow('Já existe uma conta com este Email!');
      
      expect(mockUtilizadorDAO.createTutor).not.toHaveBeenCalled();
    });
  });

  describe('Método: registarAnimal', () => {
    
    // 1. Caminho Feliz: Com microchip fornecido
    it('deve registar o animal utilizando o microchip fornecido pelo tutor', async () => {
      const dadosAnimal = { nome: 'Rex', microchip: 'CHIP-123456' };

      mockAnimalDAO.createAnimal.mockResolvedValue({ idAnimal: 'animal-1', ...dadosAnimal });

      const resultado = await facade.registarAnimal(dadosAnimal);

      expect(resultado.microchip).toBe('CHIP-123456');
      expect(mockAnimalDAO.createAnimal).toHaveBeenCalledTimes(1);
    });

    // 2. Edge Case: Sem microchip (deve gerar um provisório)
    it('deve gerar um microchip provisório caso o animal não possua microchip', async () => {
      const dadosSemChip = { nome: 'Max' };

      mockAnimalDAO.createAnimal.mockImplementation((dados: any) => Promise.resolve({ idAnimal: 'animal-2', ...dados }));

      const resultado = await facade.registarAnimal(dadosSemChip);

      expect(resultado.microchip).toMatch(/^CHIP-/);
      expect(mockAnimalDAO.createAnimal).toHaveBeenCalled();
    });

    // 3. Regra de Negócio: isValido = false e estado = Valido por defeito
    it('deve garantir que o plano vacinal submetido é guardado com isValido = false e estado = Valido', async () => {
      const dadosAnimal = { nome: 'Luna' };
      const dadosVacina = { planoVacinalUrl: 'https://s3.aws.com/vacinas/luna.pdf' };

      mockAnimalDAO.createAnimal.mockResolvedValue({ idAnimal: 'animal-3' });

      await facade.registarAnimal(dadosAnimal, dadosVacina);

      // Verificamos se a Facade alterou o objeto `dadosVacina` para aplicar as regras de negócio
      // antes de o passar ao DAO!
      expect(mockAnimalDAO.createAnimal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isValido: false,
          estado: 'Valido'
        })
      );
    });
  });

  describe('Método: atualizarPlanoVacinal', () => {
    
    // 1. Caminho Feliz
    it('deve atualizar o plano vacinal com sucesso se a data e o animal forem válidos', async () => {
      mockAnimalDAO.findByIdWithHistorial.mockResolvedValue({ idAnimal: 'animal-1', nome: 'Rex' });
      mockAnimalDAO.updatePlanoVacinal.mockResolvedValue({ idAnimal: 'animal-1' });

      const resultado = await facade.atualizarPlanoVacinal('animal-1', { dataUltimaVacina: '2026-10-10' });

      expect(resultado).toBeDefined();
      expect(mockAnimalDAO.updatePlanoVacinal).toHaveBeenCalledWith('animal-1', expect.any(Object));
    });

    // 2. Caminho Triste: Animal não encontrado
    it('deve lançar erro ao tentar atualizar vacinas de um animal inexistente', async () => {
      mockAnimalDAO.findByIdWithHistorial.mockResolvedValue(null);

      await expect(facade.atualizarPlanoVacinal('id-falso', { dataUltimaVacina: '2026-10-10' }))
        .rejects.toThrow('Animal não encontrado.');
    });

    // 3. Caminho Triste: Data inválida
    it('deve lançar erro se a data da vacina for inválida', async () => {
      mockAnimalDAO.findByIdWithHistorial.mockResolvedValue({ idAnimal: 'animal-1' });

      await expect(facade.atualizarPlanoVacinal('animal-1', { dataUltimaVacina: 'data-invalida' }))
        .rejects.toThrow('Data da vacina inválida.');
    });
  });
});
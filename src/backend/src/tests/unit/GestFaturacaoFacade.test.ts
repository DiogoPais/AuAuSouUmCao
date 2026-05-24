import { GestFaturacaoFacade } from '../../core/GestFaturacaoFacade';

describe('GestFaturacaoFacade - Testes Unitários', () => {
  let facade: GestFaturacaoFacade;
  let mockFaturaDAO: any;

  beforeEach(() => {
    facade = new GestFaturacaoFacade();

    mockFaturaDAO = (facade as any).faturaDAO;
    mockFaturaDAO.create = jest.fn();
    mockFaturaDAO.buscarPorTutor = jest.fn();
  });

  describe('Método: gerarFaturaFinal', () => {
    
    // 1. Caminho Feliz: Com NIF e método de pagamento válido
    it('deve gerar uma fatura de 150.00€ associada ao NIF e com o método de pagamento fornecido', async () => {
      mockFaturaDAO.create.mockImplementation((dados: any) => Promise.resolve({ idFaturas: 'fatura-1', ...dados }));

      const resultado = await facade.gerarFaturaFinal('reserva-1', '123456789', 'Multibanco');

      expect(resultado).toBeDefined();
      expect(resultado.valorTotal).toBe(150.00);
      expect(resultado.metodoPagamento).toBe('Multibanco');
      expect(resultado.nifCliente).toBe('123456789');
      // Verifica a geração do prefixo correto do documento PDF
      expect(resultado.documento).toMatch(/^FAT-/);
      expect(mockFaturaDAO.create).toHaveBeenCalledTimes(1);
    });

    // 2. Edge Case: Método de pagamento não fornecido (Valor Default)
    it('deve gerar fatura utilizando "Não Definido" caso o método de pagamento não seja passado', async () => {
      mockFaturaDAO.create.mockImplementation((dados: any) => Promise.resolve({ idFaturas: 'fatura-2', ...dados }));

      // Chamamos o método forçando o uso do valor default da assinatura TypeScript
      const resultado = await facade.gerarFaturaFinal('reserva-2', '987654321');

      expect(resultado.valorTotal).toBe(150.00);
      expect(resultado.metodoPagamento).toBe('Não Definido');
    });
  });
});
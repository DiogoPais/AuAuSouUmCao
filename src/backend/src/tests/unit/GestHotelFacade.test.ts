import { GestorHotelFacade } from '../../core/GestorHotelFacade';

/**
 * Testes unitários para GestorHotelFacade.
 *
 * A GestorHotelFacade é uma fachada de fachadas — delega 100% das
 * chamadas às sub-fachadas internas. Os testes verificam que a
 * delegação é feita corretamente, usando mocks das sub-fachadas.
 */
describe('GestorHotelFacade - Testes Unitários', () => {
  let facade: GestorHotelFacade;

  // Sub-fachadas mockadas
  let mockGestHospedes: any;
  let mockGestReservas: any;
  let mockGestOperacoes: any;
  let mockGestFaturacao: any;
  let mockGestClinica: any;

  beforeEach(() => {
    facade = new GestorHotelFacade();

    // Capturar as instâncias privadas criadas no constructor
    mockGestHospedes  = (facade as any).gestHospedes;
    mockGestReservas  = (facade as any).gestReservas;
    mockGestOperacoes = (facade as any).gestOperacoes;
    mockGestFaturacao = (facade as any).gestFaturacao;
    mockGestClinica   = (facade as any).gestClinica;

    // Mockar todos os métodos que são delegados
    mockGestHospedes.criarContaTutor        = jest.fn();
    mockGestHospedes.buscarUtilizadorPorEmail = jest.fn();
    mockGestHospedes.registarAnimal         = jest.fn();
    mockGestHospedes.listarTodosAnimais     = jest.fn();
    mockGestHospedes.listarAnimaisTutor     = jest.fn();
    mockGestHospedes.atualizarPlanoVacinal  = jest.fn();
    mockGestHospedes.animalDiario           = jest.fn();

    mockGestReservas.criarReserva                 = jest.fn();
    mockGestReservas.listarTodas                  = jest.fn();
    mockGestReservas.confirmarCheckIn             = jest.fn();
    mockGestReservas.processarCheckOutCompleto    = jest.fn();
    mockGestReservas.cancelarReserva              = jest.fn();
    mockGestReservas.eliminarReserva              = jest.fn();
    mockGestReservas.listarTarefasDoDia           = jest.fn();
    mockGestReservas.marcarTarefaConcluida        = jest.fn();
    mockGestReservas.obterServicosFinalizadosHoje = jest.fn();
    mockGestReservas.listarBoxesSujas             = jest.fn();
    mockGestReservas.limparBox                    = jest.fn();

    mockGestOperacoes.adicionarRegistoDiario    = jest.fn();
    mockGestOperacoes.contarFuncionarios        = jest.fn();
    mockGestOperacoes.listarFuncionarios        = jest.fn();

    mockGestFaturacao.gerarFaturaFinal          = jest.fn();
    mockGestFaturacao.listarFaturasDoTutor      = jest.fn();

    mockGestClinica.prescreverMedicacao         = jest.fn();
    mockGestClinica.listarStockCompleto         = jest.fn();
    mockGestClinica.reforcarStock               = jest.fn();
    mockGestClinica.registarCheckDiario         = jest.fn();
    mockGestClinica.listarCaesParaVerificar     = jest.fn();
    mockGestClinica.listarEmQuarentena          = jest.fn();
    mockGestClinica.ativarQuarentena            = jest.fn();
    mockGestClinica.desativarQuarentena         = jest.fn();
    mockGestClinica.verificarSeJaFoiCheckHoje   = jest.fn();
    mockGestClinica.listarPrescricoesAnimal     = jest.fn();
    mockGestClinica.listarTratamentosAtivos     = jest.fn();
    mockGestClinica.registarAdministracao       = jest.fn();
    mockGestClinica.finalizarTratamento         = jest.fn();
  });

  // ============================================================
  // Delegações: Hóspedes
  // ============================================================
  describe('Delegações para GestHospedesFacade', () => {

    it('criarConta deve delegar a criarContaTutor com os argumentos corretos', async () => {
      mockGestHospedes.criarContaTutor.mockResolvedValue({ idUtilizador: 'u-1' });

      const resultado = await facade.criarConta('Ana', 'ana@email.com', 'hash', '123', '919');

      if (!resultado) { 
        fail('Failed to create account');
      }

      expect(resultado).toBeDefined();
      expect(mockGestHospedes.criarContaTutor)
        .toHaveBeenCalledWith('Ana', 'ana@email.com', 'hash', '123', '919');
    });

    it('buscarUtilizador deve delegar a buscarUtilizadorPorEmail', async () => {
      mockGestHospedes.buscarUtilizadorPorEmail.mockResolvedValue({ email: 'ana@email.com' });

      const resultado = await facade.buscarUtilizador('ana@email.com');

      if (!resultado) { 
        fail('Failed to create account');
      }

      expect(resultado.email).toBe('ana@email.com');
      expect(mockGestHospedes.buscarUtilizadorPorEmail).toHaveBeenCalledWith('ana@email.com');
    });

    it('registarAnimal deve delegar a GestHospedes com dados e vacinas', async () => {
      const dadosAnimal = { nome: 'Rex' };
      const dadosVacina = { planoVacinalUrl: 'url' };
      mockGestHospedes.registarAnimal.mockResolvedValue({ idAnimal: 'a-1' });

      await facade.registarAnimal(dadosAnimal, dadosVacina);

      expect(mockGestHospedes.registarAnimal).toHaveBeenCalledWith(dadosAnimal, dadosVacina);
    });

    it('listarAnimais deve delegar a listarTodosAnimais', async () => {
      mockGestHospedes.listarTodosAnimais.mockResolvedValue([{ idAnimal: 'a-1' }]);

      const resultado = await facade.listarAnimais();

      expect(resultado).toHaveLength(1);
    });

    it('listarAnimaisTutor deve delegar com o NIF correto', async () => {
      mockGestHospedes.listarAnimaisTutor.mockResolvedValue([]);

      await facade.listarAnimaisTutor('123456789');

      expect(mockGestHospedes.listarAnimaisTutor).toHaveBeenCalledWith('123456789');
    });

    it('atualizarPlanoVacinal deve delegar com idAnimal e dados', async () => {
      mockGestHospedes.atualizarPlanoVacinal.mockResolvedValue({ idAnimal: 'a-1' });

      await facade.atualizarPlanoVacinal('a-1', { dataUltimaVacina: '2026-10-10' });

      expect(mockGestHospedes.atualizarPlanoVacinal)
        .toHaveBeenCalledWith('a-1', { dataUltimaVacina: '2026-10-10' });
    });

    it('animalDiario deve delegar com o animalId correto', async () => {
      mockGestHospedes.animalDiario.mockResolvedValue([{ idDiario: 'd-1' }]);

      await facade.animalDiario('a-1');

      expect(mockGestHospedes.animalDiario).toHaveBeenCalledWith('a-1');
    });
  });

  // ============================================================
  // Delegações: Reservas
  // ============================================================
  describe('Delegações para GestReservasFacade', () => {

    it('efetuarReserva deve delegar a criarReserva', async () => {
      mockGestReservas.criarReserva.mockResolvedValue({ idReserva: 'r-1' });
      const dados = { animalId: 'a-1', dataEntrada: '2026-06-01', dataSaida: '2026-06-05' };

      await facade.efetuarReserva(dados, []);

      expect(mockGestReservas.criarReserva).toHaveBeenCalledWith(dados, []);
    });

    it('listarReservas deve delegar a listarTodas', async () => {
      mockGestReservas.listarTodas.mockResolvedValue([{ idReserva: 'r-1' }]);

      const resultado = await facade.listarReservas();

      expect(resultado).toHaveLength(1);
    });

    it('checkIn deve delegar a confirmarCheckIn', async () => {
      mockGestReservas.confirmarCheckIn.mockResolvedValue({ estado: 'CheckIn' });

      await facade.checkIn('r-1', true);

      expect(mockGestReservas.confirmarCheckIn).toHaveBeenCalledWith('r-1', true);
    });

    it('checkOut deve delegar a processarCheckOutCompleto', async () => {
      mockGestReservas.processarCheckOutCompleto.mockResolvedValue({ fatura: {} });

      await facade.checkOut('r-1', 'MBWay');

      expect(mockGestReservas.processarCheckOutCompleto).toHaveBeenCalledWith('r-1', 'MBWay');
    });

    it('cancelarReserva deve delegar corretamente', async () => {
      mockGestReservas.cancelarReserva.mockResolvedValue({ estado: 'Cancelada' });

      await facade.cancelarReserva('r-1');

      expect(mockGestReservas.cancelarReserva).toHaveBeenCalledWith('r-1');
    });

    it('apagarReserva deve delegar a eliminarReserva', async () => {
      mockGestReservas.eliminarReserva.mockResolvedValue({ deleted: true });

      await facade.apagarReserva('r-1');

      expect(mockGestReservas.eliminarReserva).toHaveBeenCalledWith('r-1');
    });

    it('listarTarefasDoDia deve delegar corretamente', async () => {
      mockGestReservas.listarTarefasDoDia.mockResolvedValue([]);

      await facade.listarTarefasDoDia();

      expect(mockGestReservas.listarTarefasDoDia).toHaveBeenCalled();
    });

    it('marcarTarefaConcluida deve delegar com todos os argumentos', async () => {
      mockGestReservas.marcarTarefaConcluida.mockResolvedValue({ tipo: 'Alimentacao' });

      await facade.marcarTarefaConcluida('srv-1', 'João', 'https://foto.url');

      expect(mockGestReservas.marcarTarefaConcluida)
        .toHaveBeenCalledWith('srv-1', 'João', 'https://foto.url');
    });

    it('listarBoxesSujas deve delegar corretamente', async () => {
      mockGestReservas.listarBoxesSujas.mockResolvedValue([{ numero: 2 }]);

      const resultado = await facade.listarBoxesSujas();

      expect(resultado).toHaveLength(1);
    });

    it('limparBox deve delegar com o número da box', async () => {
      mockGestReservas.limparBox.mockResolvedValue({ numero: 2, estado: 'Limpa' });

      await facade.limparBox(2);

      expect(mockGestReservas.limparBox).toHaveBeenCalledWith(2);
    });
  });

  // ============================================================
  // Delegações: Operações, Faturação e Clínica
  // ============================================================
  describe('Delegações para GestOperacoesFacade, GestFaturacaoFacade e GestClinicaFacade', () => {

    it('adicionarRegistoDiario deve delegar a GestOperacoes', async () => {
      mockGestOperacoes.adicionarRegistoDiario.mockResolvedValue({ idDiario: 'd-1' });

      await facade.adicionarRegistoDiario('a-1', 'Comeu bem', ['foto.jpg']);

      expect(mockGestOperacoes.adicionarRegistoDiario)
        .toHaveBeenCalledWith('a-1', 'Comeu bem', ['foto.jpg']);
    });

    it('faturarReserva deve delegar a gerarFaturaFinal', async () => {
      mockGestFaturacao.gerarFaturaFinal.mockResolvedValue({ valorTotal: 150 });

      await facade.faturarReserva('r-1', '123456789');

      expect(mockGestFaturacao.gerarFaturaFinal).toHaveBeenCalledWith('r-1', '123456789');
    });

    it('listarFaturasDoTutor deve delegar com o NIF', async () => {
      mockGestFaturacao.listarFaturasDoTutor.mockResolvedValue([]);

      await facade.listarFaturasDoTutor('123456789');

      expect(mockGestFaturacao.listarFaturasDoTutor).toHaveBeenCalledWith('123456789');
    });

    it('prescreverMedicacao deve delegar a GestClinica', async () => {
      mockGestClinica.prescreverMedicacao.mockResolvedValue({ idPrescricao: 'p-1' });

      await facade.prescreverMedicacao({ linhas: [] });

      expect(mockGestClinica.prescreverMedicacao).toHaveBeenCalled();
    });

    it('listarStock deve delegar a listarStockCompleto', async () => {
      mockGestClinica.listarStockCompleto.mockResolvedValue([]);

      await facade.listarStock();

      expect(mockGestClinica.listarStockCompleto).toHaveBeenCalled();
    });

    it('reforcarStock deve delegar com idItem e quantidade', async () => {
      mockGestClinica.reforcarStock.mockResolvedValue({ quantidade: 20 });

      await facade.reforcarStock('item-1', 10);

      expect(mockGestClinica.reforcarStock).toHaveBeenCalledWith('item-1', 10);
    });

    it('registarCheckDiario deve delegar com idAnimal, notas e nomeVet', async () => {
      mockGestClinica.registarCheckDiario.mockResolvedValue({});

      await facade.registarCheckDiario('a-1', 'Sem sintomas', 'Dra. Diana');

      expect(mockGestClinica.registarCheckDiario)
        .toHaveBeenCalledWith('a-1', 'Sem sintomas', 'Dra. Diana');
    });

    it('listarCaesParaVerificar deve delegar a GestClinica', async () => {
      mockGestClinica.listarCaesParaVerificar.mockResolvedValue([]);

      await facade.listarCaesParaVerificar();

      expect(mockGestClinica.listarCaesParaVerificar).toHaveBeenCalled();
    });

    it('ativarQuarentena deve delegar com idAnimal e motivo', async () => {
      mockGestClinica.ativarQuarentena.mockResolvedValue({ emQuarentena: true });

      await facade.ativarQuarentena('a-1', 'Tosse');

      expect(mockGestClinica.ativarQuarentena).toHaveBeenCalledWith('a-1', 'Tosse');
    });

    it('desativarQuarentena deve delegar com o idAnimal', async () => {
      mockGestClinica.desativarQuarentena.mockResolvedValue({ emQuarentena: false });

      await facade.desativarQuarentena('a-1');

      expect(mockGestClinica.desativarQuarentena).toHaveBeenCalledWith('a-1');
    });

    it('listarTratamentosAtivos deve delegar a GestClinica', async () => {
      mockGestClinica.listarTratamentosAtivos.mockResolvedValue([]);

      await facade.listarTratamentosAtivos();

      expect(mockGestClinica.listarTratamentosAtivos).toHaveBeenCalled();
    });

    it('registarAdministracaoMedicamento deve delegar com idLinha e idFuncionario', async () => {
      mockGestClinica.registarAdministracao.mockResolvedValue({});

      await facade.registarAdministracaoMedicamento('linha-1', 'func-1');

      expect(mockGestClinica.registarAdministracao)
        .toHaveBeenCalledWith('linha-1', 'func-1');
    });

    it('finalizarTratamento deve delegar com o idLinha', async () => {
      mockGestClinica.finalizarTratamento.mockResolvedValue({ estado: 'Finalizado' });

      await facade.finalizarTratamento('linha-1');

      expect(mockGestClinica.finalizarTratamento).toHaveBeenCalledWith('linha-1');
    });

    it('contarFuncionarios deve delegar a GestOperacoes', async () => {
      mockGestOperacoes.contarFuncionarios.mockResolvedValue(5);

      const resultado = await facade.contarFuncionarios();

      expect(resultado).toBe(5);
    });

    it('listarFuncionarios deve delegar a GestOperacoes', async () => {
      mockGestOperacoes.listarFuncionarios.mockResolvedValue([{ idFuncionario: 'f-1' }]);

      const resultado = await facade.listarFuncionarios();

      expect(resultado).toHaveLength(1);
    });
  });
});
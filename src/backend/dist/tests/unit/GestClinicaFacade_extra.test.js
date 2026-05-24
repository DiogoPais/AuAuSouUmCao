"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GestClinicaFacade_1 = require("../../core/GestClinicaFacade");
/**
 * Testes adicionais para GestClinicaFacade.
 * Cobrem: reforcarStock, registarCheckDiario, ativarQuarentena,
 *         registarAdministracao, finalizarTratamento, e métodos
 *         de listagem simples que estavam sem cobertura.
 */
describe('GestClinicaFacade - Testes Adicionais (Cobertura Extra)', () => {
    let facade;
    let mockStockDAO;
    let mockPrescricaoDAO;
    beforeEach(() => {
        facade = new GestClinicaFacade_1.GestClinicaFacade();
        mockStockDAO = facade.stockDAO;
        mockPrescricaoDAO = facade.prescricaoDAO;
        mockStockDAO.findAll = jest.fn();
        mockStockDAO.findById = jest.fn();
        mockStockDAO.updateQuantidade = jest.fn();
        mockStockDAO.findItemPorNome = jest.fn();
        mockPrescricaoDAO.registarCheckDiario = jest.fn();
        mockPrescricaoDAO.listarCaesParaVerificar = jest.fn();
        mockPrescricaoDAO.listarEmQuarentena = jest.fn();
        mockPrescricaoDAO.ativarQuarentena = jest.fn();
        mockPrescricaoDAO.desativarQuarentena = jest.fn();
        mockPrescricaoDAO.verificarSeJaFoiCheckHoje = jest.fn();
        mockPrescricaoDAO.findByAnimal = jest.fn();
        mockPrescricaoDAO.listarTratamentosAtivos = jest.fn();
        mockPrescricaoDAO.registarAdministracao = jest.fn();
        mockPrescricaoDAO.finalizarTratamento = jest.fn();
        mockPrescricaoDAO.buscarPrimeiroFuncionarioVet = jest.fn();
        mockPrescricaoDAO.create = jest.fn();
    });
    // ============================================================
    // reforcarStock
    // ============================================================
    describe('Método: reforcarStock', () => {
        it('deve adicionar a quantidade ao stock existente e retornar o item atualizado', async () => {
            mockStockDAO.findById.mockResolvedValue({ idItem: 'item-1', nome: 'Insulina', quantidade: 10 });
            mockStockDAO.updateQuantidade.mockResolvedValue({ idItem: 'item-1', quantidade: 25 });
            const resultado = await facade.reforcarStock('item-1', 15);
            expect(resultado.quantidade).toBe(25);
            expect(mockStockDAO.updateQuantidade).toHaveBeenCalledWith('item-1', 25);
        });
        it('deve lançar erro se a quantidade a adicionar for zero', async () => {
            await expect(facade.reforcarStock('item-1', 0))
                .rejects.toThrow('A quantidade a adicionar deve ser maior que zero.');
        });
        it('deve lançar erro se a quantidade a adicionar for negativa', async () => {
            await expect(facade.reforcarStock('item-1', -5))
                .rejects.toThrow('A quantidade a adicionar deve ser maior que zero.');
        });
        it('deve lançar erro se o item de stock não existir', async () => {
            mockStockDAO.findById.mockResolvedValue(null);
            await expect(facade.reforcarStock('item-inexistente', 10))
                .rejects.toThrow('Item de stock não encontrado.');
        });
    });
    // ============================================================
    // registarCheckDiario
    // ============================================================
    describe('Método: registarCheckDiario', () => {
        it('deve registar o check diário com notas válidas e nome do veterinário', async () => {
            mockPrescricaoDAO.registarCheckDiario.mockResolvedValue({ idCheck: 'check-1' });
            const resultado = await facade.registarCheckDiario('animal-1', 'Come bem, sem sintomas.', 'Dra. Diana');
            expect(resultado).toBeDefined();
            expect(mockPrescricaoDAO.registarCheckDiario)
                .toHaveBeenCalledWith('animal-1', 'Come bem, sem sintomas.', 'Dra. Diana');
        });
        it('deve usar "Veterinário(a)" como nome por defeito quando não é fornecido', async () => {
            mockPrescricaoDAO.registarCheckDiario.mockResolvedValue({ idCheck: 'check-2' });
            await facade.registarCheckDiario('animal-1', 'Tudo normal.');
            expect(mockPrescricaoDAO.registarCheckDiario)
                .toHaveBeenCalledWith('animal-1', 'Tudo normal.', 'Veterinário(a)');
        });
        it('deve lançar erro se as notas estiverem vazias', async () => {
            await expect(facade.registarCheckDiario('animal-1', ''))
                .rejects.toThrow('O check deve incluir notas do veterinário.');
        });
        it('deve lançar erro se as notas forem apenas espaços em branco', async () => {
            await expect(facade.registarCheckDiario('animal-1', '   '))
                .rejects.toThrow('O check deve incluir notas do veterinário.');
        });
    });
    // ============================================================
    // ativarQuarentena
    // ============================================================
    describe('Método: ativarQuarentena', () => {
        it('deve ativar a quarentena com motivo válido', async () => {
            mockPrescricaoDAO.ativarQuarentena.mockResolvedValue({ idAnimal: 'animal-1', emQuarentena: true });
            const resultado = await facade.ativarQuarentena('animal-1', 'Tosse suspeita de Bordetella');
            expect(resultado.emQuarentena).toBe(true);
            expect(mockPrescricaoDAO.ativarQuarentena)
                .toHaveBeenCalledWith('animal-1', 'Tosse suspeita de Bordetella');
        });
        it('deve lançar erro se o motivo estiver vazio', async () => {
            await expect(facade.ativarQuarentena('animal-1', ''))
                .rejects.toThrow('Deve incluir um motivo para a quarentena.');
        });
        it('deve lançar erro se o motivo for apenas espaços em branco', async () => {
            await expect(facade.ativarQuarentena('animal-1', '   '))
                .rejects.toThrow('Deve incluir um motivo para a quarentena.');
        });
    });
    // ============================================================
    // registarAdministracao
    // ============================================================
    describe('Método: registarAdministracao', () => {
        it('deve registar a administração quando os dados são válidos', async () => {
            mockPrescricaoDAO.registarAdministracao.mockResolvedValue({ idAdmin: 'adm-1' });
            const resultado = await facade.registarAdministracao('linha-1', 'funcionario-1');
            expect(resultado).toBeDefined();
            expect(mockPrescricaoDAO.registarAdministracao)
                .toHaveBeenCalledWith('linha-1', 'funcionario-1');
        });
        it('deve lançar erro se o idLinha estiver vazio', async () => {
            await expect(facade.registarAdministracao('', 'funcionario-1'))
                .rejects.toThrow('Dados incompletos para registar administração.');
        });
        it('deve lançar erro se o idFuncionario estiver vazio', async () => {
            await expect(facade.registarAdministracao('linha-1', ''))
                .rejects.toThrow('Dados incompletos para registar administração.');
        });
    });
    // ============================================================
    // prescreverMedicacao — edge case sem veterinário disponível
    // ============================================================
    describe('Método: prescreverMedicacao — edge case sem veterinário disponível', () => {
        it('deve lançar erro se não existir nenhum veterinário na DB quando o funcionarioId é omitido', async () => {
            mockPrescricaoDAO.buscarPrimeiroFuncionarioVet.mockResolvedValue(null);
            const dados = {
                animalId: 'animal-1',
                linhas: [{ medicamentoId: 'Insulina', dosagem: 1, totalDoses: 1 }]
            };
            await expect(facade.prescreverMedicacao(dados))
                .rejects.toThrow('Nenhum veterinário disponível para prescrição.');
        });
    });
    // ============================================================
    // Métodos de listagem e delegação simples
    // ============================================================
    describe('Métodos de listagem e delegação', () => {
        it('listarStockCompleto deve retornar todos os itens do stock', async () => {
            mockStockDAO.findAll.mockResolvedValue([{ idItem: 'i-1' }, { idItem: 'i-2' }]);
            const resultado = await facade.listarStockCompleto();
            expect(resultado).toHaveLength(2);
            expect(mockStockDAO.findAll).toHaveBeenCalled();
        });
        it('listarCaesParaVerificar deve delegar ao DAO', async () => {
            mockPrescricaoDAO.listarCaesParaVerificar.mockResolvedValue([{ idAnimal: 'a-1' }]);
            const resultado = await facade.listarCaesParaVerificar();
            expect(resultado).toHaveLength(1);
        });
        it('listarEmQuarentena deve delegar ao DAO', async () => {
            mockPrescricaoDAO.listarEmQuarentena.mockResolvedValue([]);
            const resultado = await facade.listarEmQuarentena();
            expect(resultado).toHaveLength(0);
            expect(mockPrescricaoDAO.listarEmQuarentena).toHaveBeenCalled();
        });
        it('desativarQuarentena deve delegar ao DAO com o ID correto', async () => {
            mockPrescricaoDAO.desativarQuarentena.mockResolvedValue({ idAnimal: 'a-1', emQuarentena: false });
            const resultado = await facade.desativarQuarentena('a-1');
            expect(resultado.emQuarentena).toBe(false);
            expect(mockPrescricaoDAO.desativarQuarentena).toHaveBeenCalledWith('a-1');
        });
        it('verificarSeJaFoiCheckHoje deve delegar ao DAO', async () => {
            mockPrescricaoDAO.verificarSeJaFoiCheckHoje.mockResolvedValue(true);
            const resultado = await facade.verificarSeJaFoiCheckHoje('animal-1');
            expect(resultado).toBe(true);
        });
        it('listarPrescricoesAnimal deve retornar prescrições por animal', async () => {
            mockPrescricaoDAO.findByAnimal.mockResolvedValue([{ idPrescricao: 'p-1' }]);
            const resultado = await facade.listarPrescricoesAnimal('animal-1');
            expect(resultado).toHaveLength(1);
            expect(mockPrescricaoDAO.findByAnimal).toHaveBeenCalledWith('animal-1');
        });
        it('listarTratamentosAtivos deve delegar ao DAO', async () => {
            mockPrescricaoDAO.listarTratamentosAtivos.mockResolvedValue([{ idLinha: 'l-1' }]);
            const resultado = await facade.listarTratamentosAtivos();
            expect(resultado).toHaveLength(1);
        });
        it('finalizarTratamento deve delegar ao DAO com o idLinha correto', async () => {
            mockPrescricaoDAO.finalizarTratamento.mockResolvedValue({ idLinha: 'l-1', estado: 'Finalizado' });
            const resultado = await facade.finalizarTratamento('l-1');
            expect(resultado.estado).toBe('Finalizado');
            expect(mockPrescricaoDAO.finalizarTratamento).toHaveBeenCalledWith('l-1');
        });
    });
});

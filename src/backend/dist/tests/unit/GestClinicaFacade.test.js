"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GestClinicaFacade_1 = require("../../core/GestClinicaFacade");
describe('GestClinicaFacade - Testes Unitários', () => {
    let facade;
    let mockStockDAO;
    let mockPrescricaoDAO;
    let mockLogsDAO;
    beforeEach(() => {
        // 1. Instanciar a Facade real
        facade = new GestClinicaFacade_1.GestClinicaFacade();
        // 2. Capturar instâncias privadas
        mockStockDAO = facade.stockDAO;
        mockPrescricaoDAO = facade.prescricaoDAO;
        mockLogsDAO = facade.logsDAO;
        // 3. Substituir os métodos reais por funções espiãs
        mockStockDAO.findItemPorNome = jest.fn();
        mockStockDAO.updateQuantidade = jest.fn();
        mockPrescricaoDAO.buscarPrimeiroFuncionarioVet = jest.fn();
        mockPrescricaoDAO.create = jest.fn();
    });
    describe('Método: prescreverMedicacao', () => {
        // 1. Caminho Feliz
        it('deve criar uma prescrição com sucesso e deduzir a quantidade correta do stock', async () => {
            const dadosPrescricao = {
                animalId: 'animal-bob',
                funcionarioId: 'vet-123',
                linhas: [
                    { medicamentoId: 'Insulina', dosagem: 2, totalDoses: 3 } // Precisa de 6 unidades
                ]
            };
            // O mock deve simular a estrutura do teu Prisma: o stockItem contém um objeto "medicamento"
            mockStockDAO.findItemPorNome.mockResolvedValue({
                idItem: 'item-insulina',
                nome: 'Insulina',
                quantidade: 10,
                medicamento: { idMedicamento: 'med-insulina' }
            });
            mockPrescricaoDAO.create.mockResolvedValue({ idPrescricao: 'presc-001' });
            const resultado = await facade.prescreverMedicacao(dadosPrescricao);
            expect(resultado).toBeDefined();
            expect(mockStockDAO.findItemPorNome).toHaveBeenCalledWith('Insulina');
            // Deduziu 6 de 10 (sobram 4)
            expect(mockStockDAO.updateQuantidade).toHaveBeenCalledWith('item-insulina', 4);
            expect(mockPrescricaoDAO.create).toHaveBeenCalledTimes(1);
        });
        // 2. Caminho Triste: Lista vazia
        it('deve lançar erro se a prescrição não contiver pelo menos um medicamento', async () => {
            const dadosInvalidos = {
                animalId: 'animal-bob',
                funcionarioId: 'vet-123',
                linhas: []
            };
            await expect(facade.prescreverMedicacao(dadosInvalidos)).rejects.toThrow('deve conter pelo menos um medicamento');
        });
        // 3. Caminho Triste: Dosagem igual a zero
        it('deve lançar erro se a dosagem ou o total de doses for inferior ou igual a zero', async () => {
            const dadosInvalidos = {
                funcionarioId: 'vet-123',
                linhas: [{ medicamentoId: 'Vacina', dosagem: 0, totalDoses: 5 }]
            };
            await expect(facade.prescreverMedicacao(dadosInvalidos)).rejects.toThrow('superiores a zero');
        });
        // 4. Caminho Triste: Medicamento inexistente no inventário
        it('deve lançar erro se o item solicitado não for encontrado no stock', async () => {
            const dadosInvalidos = {
                funcionarioId: 'vet-123',
                linhas: [{ medicamentoId: 'Fantasma', dosagem: 1, totalDoses: 2 }]
            };
            // Simular que o DAO retorna null
            mockStockDAO.findItemPorNome.mockResolvedValue(null);
            await expect(facade.prescreverMedicacao(dadosInvalidos)).rejects.toThrow('não encontrado no stock');
            expect(mockStockDAO.updateQuantidade).not.toHaveBeenCalled();
        });
        // 5. Caminho Triste: Stock Insuficiente
        it('deve lançar erro detalhado se a quantidade em stock for insuficiente para a prescrição', async () => {
            const dadosInvalidos = {
                funcionarioId: 'vet-123',
                linhas: [{ medicamentoId: 'Antibiotico', dosagem: 5, totalDoses: 4 }] // Precisa de 20
            };
            mockStockDAO.findItemPorNome.mockResolvedValue({
                idItem: 'item-antibiotico',
                nome: 'Antibiotico',
                quantidade: 15, // Só tem 15 (falha!)
                medicamento: { idMedicamento: 'med-antibiotico' }
            });
            await expect(facade.prescreverMedicacao(dadosInvalidos)).rejects.toThrow(/Stock insuficiente/i);
            expect(mockStockDAO.updateQuantidade).not.toHaveBeenCalled();
        });
        // 6. Edge Case: Limite Exato + Testar o fallback de Veterinário Default
        it('deve permitir criar a prescrição se a quantidade requerida for exatamente igual ao stock disponível', async () => {
            const dadosLimite = {
                animalId: 'animal-bob',
                // ATENÇÃO: Retiramos propositadamente o funcionarioId para testar o comportamento de fallback
                linhas: [{ medicamentoId: 'Xarope', dosagem: 2, totalDoses: 5 }] // Precisa de 10
            };
            // Simular fallback do veterinário
            mockPrescricaoDAO.buscarPrimeiroFuncionarioVet.mockResolvedValue({ idFuncionario: 'vet-default-99' });
            // O stock tem exatamente 10 unidades
            mockStockDAO.findItemPorNome.mockResolvedValue({
                idItem: 'item-xarope',
                nome: 'Xarope',
                quantidade: 10,
                medicamento: { idMedicamento: 'med-xarope' }
            });
            mockPrescricaoDAO.create.mockResolvedValue({ idPrescricao: 'presc-limite' });
            const resultado = await facade.prescreverMedicacao(dadosLimite);
            expect(resultado).toBeDefined();
            // Verificamos que o DAO do funcionário foi chamado!
            expect(mockPrescricaoDAO.buscarPrimeiroFuncionarioVet).toHaveBeenCalledTimes(1);
            // O stock final deve passar a ser exatamente 0 unidades
            expect(mockStockDAO.updateQuantidade).toHaveBeenCalledWith('item-xarope', 0);
        });
    });
});

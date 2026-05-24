"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GestOperacoesFacade_1 = require("../../core/GestOperacoesFacade");
describe('GestOperacoesFacade - Testes Unitários', () => {
    let facade;
    let mockDiarioDAO;
    let mockUtilizadoresDAO;
    beforeEach(() => {
        facade = new GestOperacoesFacade_1.GestOperacoesFacade();
        mockDiarioDAO = facade.diarioDAO;
        mockUtilizadoresDAO = facade.utilizadoresDAO;
        mockDiarioDAO.create = jest.fn();
        mockUtilizadoresDAO.countTotal = jest.fn();
        mockUtilizadoresDAO.countByPerfil = jest.fn();
        mockUtilizadoresDAO.findAll = jest.fn();
    });
    describe('Método: adicionarRegistoDiario', () => {
        // 1. Caminho Feliz: Com descrição e sem fotos
        it('deve criar o registo quando apenas uma descrição é fornecida', async () => {
            mockDiarioDAO.create.mockResolvedValue({ idDiario: 'diario-1' });
            const resultado = await facade.adicionarRegistoDiario('animal-1', 'Comeu tudo', []);
            expect(resultado).toBeDefined();
            expect(mockDiarioDAO.create).toHaveBeenCalledWith('Comeu tudo', 'animal-1', []);
        });
        // 2. Caminho Feliz: Sem descrição mas com foto
        it('deve criar o registo quando a descrição é vazia mas contém pelo menos uma foto', async () => {
            mockDiarioDAO.create.mockResolvedValue({ idDiario: 'diario-2' });
            const resultado = await facade.adicionarRegistoDiario('animal-1', '', ['https://aws.s3/foto.jpg']);
            expect(resultado).toBeDefined();
            expect(mockDiarioDAO.create).toHaveBeenCalledWith('', 'animal-1', ['https://aws.s3/foto.jpg']);
        });
        // 3. Caminho Triste: Sem descrição e sem fotos
        it('deve lançar erro se tentar criar um registo sem descrição e sem fotografias', async () => {
            await expect(facade.adicionarRegistoDiario('animal-1', '', []))
                .rejects.toThrow('O registo deve conter uma descrição ou fotografia.');
            expect(mockDiarioDAO.create).not.toHaveBeenCalled();
        });
    });
    describe('Métodos Auxiliares de Funcionários', () => {
        it('deve invocar o DAO correto ao contar funcionários por perfil', async () => {
            mockUtilizadoresDAO.countByPerfil.mockResolvedValue(5);
            const resultado = await facade.contarFuncionariosPorPerfil('Staff');
            expect(resultado).toBe(5);
            expect(mockUtilizadoresDAO.countByPerfil).toHaveBeenCalledWith('Staff');
        });
    });
});

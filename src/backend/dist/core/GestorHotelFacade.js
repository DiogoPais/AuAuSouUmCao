"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestorHotelFacade = void 0;
const GestHospedesFacade_1 = require("./GestHospedesFacade");
const GestReservasFacade_1 = require("./GestReservasFacade");
const GestOperacoesFacade_1 = require("./GestOperacoesFacade");
const GestFaturacaoFacade_1 = require("./GestFaturacaoFacade");
const GestClinicaFacade_1 = require("./GestClinicaFacade");
class GestorHotelFacade {
    gestHospedes;
    gestReservas;
    gestOperacoes;
    gestFaturacao;
    gestClinica;
    constructor() {
        this.gestHospedes = new GestHospedesFacade_1.GestHospedesFacade();
        this.gestReservas = new GestReservasFacade_1.GestReservasFacade();
        this.gestOperacoes = new GestOperacoesFacade_1.GestOperacoesFacade();
        this.gestFaturacao = new GestFaturacaoFacade_1.GestFaturacaoFacade();
        this.gestClinica = new GestClinicaFacade_1.GestClinicaFacade();
    }
    // ==========================================
    // DELEGAÇÃO: HÓSPEDES E CONTAS
    // ==========================================
    async criarConta(nome, email, passwordHash, nif, telemovel) {
        return await this.gestHospedes.criarContaTutor(nome, email, passwordHash, nif, telemovel);
    }
    async buscarUtilizador(email) {
        return await this.gestHospedes.buscarUtilizadorPorEmail(email);
    }
    async registarAnimal(dadosAnimal, dadosVacina) {
        return await this.gestHospedes.registarAnimal(dadosAnimal, dadosVacina);
    }
    async listarAnimais() {
        return await this.gestHospedes.listarTodosAnimais();
    }
    async listarAnimaisTutor(nif) {
        return await this.gestHospedes.listarAnimaisTutor(nif);
    }
    async atualizarPlanoVacinal(idAnimal, dadosVacina) {
        return await this.gestHospedes.atualizarPlanoVacinal(idAnimal, dadosVacina);
    }
    async obterUtilizadorPorEmail(email) {
        return await this.gestHospedes.buscarUtilizadorPorEmail(email);
    }
    // ==========================================
    // DELEGAÇÃO: RESERVAS
    // ==========================================
    async efetuarReserva(dadosReserva, servicos) {
        return await this.gestReservas.criarReserva(dadosReserva, servicos);
    }
    async listarReservas() {
        return await this.gestReservas.listarTodas();
    }
    async checkIn(idReserva, termosAceites) {
        return await this.gestReservas.confirmarCheckIn(idReserva, termosAceites);
    }
    async checkOut(idReserva, metodoPagamento) {
        return await this.gestReservas.processarCheckOutCompleto(idReserva, metodoPagamento);
    }
    async cancelarReserva(idReserva) {
        return await this.gestReservas.cancelarReserva(idReserva);
    }
    async apagarReserva(idReserva) {
        return await this.gestReservas.eliminarReserva(idReserva);
    }
    // ==========================================
    // DELEGAÇÃO: OPERAÇÕES, FATURAÇÃO E CLÍNICA
    // ==========================================
    async adicionarRegistoDiario(animalId, descricao, fotos = []) {
        return await this.gestOperacoes.adicionarRegistoDiario(animalId, descricao, fotos);
    }
    async faturarReserva(idReserva, nifCliente) {
        return await this.gestFaturacao.gerarFaturaFinal(idReserva, nifCliente);
    }
    async prescreverMedicacao(dados) {
        return await this.gestClinica.prescreverMedicacao(dados);
    }
    async listarStock() {
        return await this.gestClinica.listarStockCompleto();
    }
    async reforcarStock(idItem, quantidadeAdicionada) {
        return await this.gestClinica.reforcarStock(idItem, quantidadeAdicionada);
    }
    // ==========================================
    // DELEGAÇÃO: VETERINÁRIA
    // ==========================================
    // 👇 ATUALIZADO: Agora recebe o nome do Veterinário
    async registarCheckDiario(idAnimal, notas, nomeVet = 'Veterinário(a)') {
        return await this.gestClinica.registarCheckDiario(idAnimal, notas, nomeVet);
    }
    async listarCaesParaVerificar() {
        return await this.gestClinica.listarCaesParaVerificar();
    }
    async listarEmQuarentena() {
        return await this.gestClinica.listarEmQuarentena();
    }
    async ativarQuarentena(idAnimal, motivo) {
        return await this.gestClinica.ativarQuarentena(idAnimal, motivo);
    }
    async desativarQuarentena(idAnimal) {
        return await this.gestClinica.desativarQuarentena(idAnimal);
    }
    async verificarSeJaFoiCheckHoje(idAnimal) {
        return await this.gestClinica.verificarSeJaFoiCheckHoje(idAnimal);
    }
    async listarPrescricoesAnimal(animalId) {
        return await this.gestClinica.listarPrescricoesAnimal(animalId);
    }
    // ==========================================
    // DELEGAÇÃO: TAREFAS E FUNCIONÁRIOS
    // ==========================================
    async listarTarefasDoDia() {
        return await this.gestReservas.listarTarefasDoDia();
    }
    async marcarTarefaConcluida(idServico, nomeStaff = 'Staff', fotoUrl) {
        return await this.gestReservas.marcarTarefaConcluida(idServico, nomeStaff, fotoUrl);
    }
    async contarFuncionarios() {
        return await this.gestOperacoes.contarFuncionarios();
    }
    async listarFuncionarios() {
        return await this.gestOperacoes.listarFuncionarios();
    }
    // ==========================================
    // DIARIO DE BORDO
    // ==========================================
    async animalDiario(animalId) {
        return await this.gestHospedes.animalDiario(animalId);
    }
    async listarServicosFinalizados(animalId) {
        return await this.gestReservas.obterServicosFinalizadosHoje(animalId);
    }
    async listarTratamentosAtivos() {
        return await this.gestClinica.listarTratamentosAtivos();
    }
    async registarAdministracaoMedicamento(idLinha, idFuncionario) {
        return await this.gestClinica.registarAdministracao(idLinha, idFuncionario);
    }
    async finalizarTratamento(idLinha) {
        return await this.gestClinica.finalizarTratamento(idLinha);
    }
    async obterServicosFinalizadosHoje(id) {
        return await this.gestReservas.obterServicosFinalizadosHoje(id);
    }
    async listarFaturasDoTutor(nif) {
        return await this.gestFaturacao.listarFaturasDoTutor(nif);
    }
    async listarBoxesSujas() {
        return await this.gestReservas.listarBoxesSujas();
    }
    async limparBox(numero) {
        return await this.gestReservas.limparBox(numero);
    }
}
exports.GestorHotelFacade = GestorHotelFacade;

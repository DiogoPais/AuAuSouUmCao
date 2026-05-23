import { GestHospedesFacade } from './GestHospedesFacade';
import { GestReservasFacade } from './GestReservasFacade';
import { GestOperacoesFacade } from './GestOperacoesFacade';
import { GestFaturacaoFacade } from './GestFaturacaoFacade';
import { GestClinicaFacade } from './GestClinicaFacade';

export class GestorHotelFacade {
  private gestHospedes: GestHospedesFacade;
  private gestReservas: GestReservasFacade;
  private gestOperacoes: GestOperacoesFacade;
  private gestFaturacao: GestFaturacaoFacade;
  private gestClinica: GestClinicaFacade;

  constructor() {
    this.gestHospedes = new GestHospedesFacade();
    this.gestReservas = new GestReservasFacade();
    this.gestOperacoes = new GestOperacoesFacade();
    this.gestFaturacao = new GestFaturacaoFacade();
    this.gestClinica = new GestClinicaFacade();
  }

  // ==========================================
  // DELEGAÇÃO: HÓSPEDES E CONTAS
  // ==========================================
  async criarConta(nome: string, email: string, passwordHash: string, nif: string, telemovel: string) {
    return await this.gestHospedes.criarContaTutor(nome, email, passwordHash, nif, telemovel);
  }

  async buscarUtilizador(email: string) {
    return await this.gestHospedes.buscarUtilizadorPorEmail(email);
  }

  async registarAnimal(dadosAnimal: any, dadosVacina?: any) {
    return await this.gestHospedes.registarAnimal(dadosAnimal, dadosVacina);
  }

  async listarAnimais() { 
    return await this.gestHospedes.listarTodosAnimais(); 
  }

  async listarAnimaisTutor(nif: string) { 
    return await this.gestHospedes.listarAnimaisTutor(nif); 
  }

  async atualizarPlanoVacinal(idAnimal: string, dadosVacina: any) {
    return await this.gestHospedes.atualizarPlanoVacinal(idAnimal, dadosVacina);
  }

  async obterUtilizadorPorEmail(email: string) {
    return await this.gestHospedes.buscarUtilizadorPorEmail(email);
  }
  // ==========================================
  // DELEGAÇÃO: RESERVAS
  // ==========================================
  async efetuarReserva(dadosReserva: any, servicos: any[]) {
    return await this.gestReservas.criarReserva(dadosReserva, servicos);
  }

  async listarReservas() { 
    return await this.gestReservas.listarTodas(); 
  }

  async checkIn(idReserva: string, termosAceites: boolean) { 
    return await this.gestReservas.confirmarCheckIn(idReserva, termosAceites); 
  }

  async checkOut(idReserva: string, metodoPagamento: string) { 
    return await this.gestReservas.processarCheckOutCompleto(idReserva, metodoPagamento); 
  }

  async cancelarReserva(idReserva: string) { 
    return await this.gestReservas.cancelarReserva(idReserva); 
  }

  async apagarReserva(idReserva: string) { 
    return await this.gestReservas.eliminarReserva(idReserva); 
  }

  // ==========================================
  // DELEGAÇÃO: OPERAÇÕES, FATURAÇÃO E CLÍNICA
  // ==========================================
  async adicionarRegistoDiario(animalId: string, descricao: string, fotos: string[] = []) {
    return await this.gestOperacoes.adicionarRegistoDiario(animalId, descricao, fotos);
  }

  async faturarReserva(idReserva: string, nifCliente: string) {
    return await this.gestFaturacao.gerarFaturaFinal(idReserva, nifCliente);
  }

  async prescreverMedicacao(dados: any) {
    return await this.gestClinica.prescreverMedicacao(dados);
  }

  async listarStock() {
    return await this.gestClinica.listarStockCompleto();
  }

  async reforcarStock(idItem: string, quantidadeAdicionada: number) {
    return await this.gestClinica.reforcarStock(idItem, quantidadeAdicionada);
  }

  // ==========================================
  // DELEGAÇÃO: VETERINÁRIA
  // ==========================================
  // 👇 ATUALIZADO: Agora recebe o nome do Veterinário
  async registarCheckDiario(idAnimal: string, notas: string, nomeVet: string = 'Veterinário(a)') {
    return await this.gestClinica.registarCheckDiario(idAnimal, notas, nomeVet);
  }

  async listarCaesParaVerificar() {
    return await this.gestClinica.listarCaesParaVerificar();
  }

  async listarEmQuarentena() {
    return await this.gestClinica.listarEmQuarentena();
  }

  async ativarQuarentena(idAnimal: string, motivo: string) {
    return await this.gestClinica.ativarQuarentena(idAnimal, motivo);
  }

  async desativarQuarentena(idAnimal: string) {
    return await this.gestClinica.desativarQuarentena(idAnimal);
  }

  async verificarSeJaFoiCheckHoje(idAnimal: string) {
    return await this.gestClinica.verificarSeJaFoiCheckHoje(idAnimal);
  }

  async listarPrescricoesAnimal(animalId: string) {
    return await this.gestClinica.listarPrescricoesAnimal(animalId);
  }

  // ==========================================
  // DELEGAÇÃO: TAREFAS E FUNCIONÁRIOS
  // ==========================================
  async listarTarefasDoDia() {
    return await this.gestReservas.listarTarefasDoDia();
  }


    async marcarTarefaConcluida(idServico: string, nomeStaff: string = 'Staff', fotoUrl?: string) {
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
  async animalDiario(animalId: string) {
    return await this.gestHospedes.animalDiario(animalId);
  }

  async listarServicosFinalizados(animalId: string) {
    return await this.gestReservas.obterServicosFinalizadosHoje(animalId);
  }

  async listarTratamentosAtivos() {
    return await this.gestClinica.listarTratamentosAtivos();
  }

  async registarAdministracaoMedicamento(idLinha: string, idFuncionario: string) {
    return await this.gestClinica.registarAdministracao(idLinha, idFuncionario);
  }

  async finalizarTratamento(idLinha: string) {
    return await this.gestClinica.finalizarTratamento(idLinha);
  }

  async obterServicosFinalizadosHoje(id: string) { 
    return await this.gestReservas.obterServicosFinalizadosHoje(id); 
  }

  async listarFaturasDoTutor(nif: string) {
    return await this.gestFaturacao.listarFaturasDoTutor(nif);
  }

  async listarBoxesSujas() {
        return await this.gestReservas.listarBoxesSujas();
    }
    async limparBox(numero: number) {
        return await this.gestReservas.limparBox(numero);
    }

}

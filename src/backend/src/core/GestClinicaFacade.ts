import { PrescricaoDAO } from '../dao/PrescricaoDAO';
import { StockDAO } from '../dao/StockDAO';
import { LogsDAO } from '../dao/LogsDAO';

export class GestClinicaFacade {
  private prescricaoDAO: PrescricaoDAO;
  private stockDAO: StockDAO;
  private logsDAO: LogsDAO;

  constructor() {
    this.prescricaoDAO = new PrescricaoDAO();
    this.stockDAO = new StockDAO();
    this.logsDAO = new LogsDAO();
  }

  // ==========================================
  // PRESCRIÇÃO E STOCK
  // ==========================================
  async prescreverMedicacao(dadosPrescricao: any) {
    // dadosPrescricao = { animalId, funcionarioId (opcional), linhas: [{ medicamentoId, dosagem, frequencia }] }
    
    if (!dadosPrescricao.linhas || dadosPrescricao.linhas.length === 0) {
      throw new Error("A prescrição deve conter pelo menos um medicamento.");
    }

    for (const linha of dadosPrescricao.linhas) {
      if (linha.dosagem <= 0) {
        throw new Error("A dosagem clínica deve ser superior a zero.");
      }
    }

    // Se não houver funcionarioId, busca o primeiro funcionário Vet da BD
    if (!dadosPrescricao.funcionarioId) {
      const funcionarioDefault = await this.prescricaoDAO.buscarPrimeiroFuncionarioVet();
      if (!funcionarioDefault) {
        throw new Error("Nenhum veterinário disponível para prescrição.");
      }
      dadosPrescricao.funcionarioId = funcionarioDefault.idFuncionario;
    }

    // 1. Criar a Prescrição (O DAO trata do Nested Write)
    const novaPrescricao = await this.prescricaoDAO.create(dadosPrescricao);

    // 2. Descontar o Stock usando o StockDAO
    for (const linha of dadosPrescricao.linhas) {
      const med = await this.stockDAO.findMedicamentoComStock(linha.medicamentoId);
      if (med && med.stock) {
        const novaQuantidade = Math.max(0, med.stock.quantidade - linha.dosagem);
        await this.stockDAO.updateQuantidade(med.stockId, novaQuantidade);
      }
    }

    return novaPrescricao;
  }

  async listarStockCompleto() {
    return await this.stockDAO.findAll();
  }

  async registarAdministracaoFoco(funcionarioId: string) {
    return await this.logsDAO.createLog(funcionarioId);
  }

  // ==========================================
  // GESTÃO DE CHECKS DIÁRIOS E QUARENTENA
  // ==========================================
  async registarCheckDiario(idAnimal: string, notas: string) {
    if (!notas || notas.trim().length === 0) {
      throw new Error("O check deve incluir notas do veterinário.");
    }
    // Delega para o DAO (que vai mudar o 'check' para true e adicionar ao DiarioBordo)
    return await this.prescricaoDAO.registarCheckDiario(idAnimal, notas);
  }

  async listarCaesParaVerificar() {
    return await this.prescricaoDAO.listarCaesParaVerificar();
  }

  async listarEmQuarentena() {
    return await this.prescricaoDAO.listarEmQuarentena();
  }

  async ativarQuarentena(idAnimal: string, motivo: string) {
    if (!motivo || motivo.trim().length === 0) {
      throw new Error("Deve incluir um motivo para a quarentena.");
    }
    return await this.prescricaoDAO.ativarQuarentena(idAnimal, motivo);
  }

  async desativarQuarentena(idAnimal: string) {
    return await this.prescricaoDAO.desativarQuarentena(idAnimal);
  }

  async verificarSeJaFoiCheckHoje(idAnimal: string) {
    return await this.prescricaoDAO.verificarSeJaFoiCheckHoje(idAnimal);
  }

  async listarPrescricoesAnimal(animalId: string) {
    return await this.prescricaoDAO.findByAnimal(animalId);
  }
}
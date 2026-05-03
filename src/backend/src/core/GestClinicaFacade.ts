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

  // Regra de Negócio: Validação Clínica (US03)
  async prescreverMedicacao(dadosPrescricao: any) {
    if (dadosPrescricao.dosagem <= 0) {
      throw new Error("A dosagem clínica deve ser superior a zero.");
    }
    return await this.prescricaoDAO.create(dadosPrescricao);
  }

  async listarStockCompleto() {
    return await this.stockDAO.findAll();
  }

  // Regra de Negócio: Log de Administração Imutável (RF.22 / R15)
  async registarAdministracaoFoco(funcionarioId: string) {
    return await this.logsDAO.createLog(funcionarioId);
  }

  // ==========================================
  // GESTÃO DE CHECKS DIÁRIOS
  // ==========================================
  async registarCheckDiario(idAnimal: string, notas: string) {
    if (!notas || notas.trim().length === 0) {
      throw new Error("O check deve incluir notas do veterinário.");
    }
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
}

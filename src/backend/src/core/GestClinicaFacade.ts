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
    if (!dadosPrescricao.linhas || dadosPrescricao.linhas.length === 0) {
      throw new Error("A prescrição deve conter pelo menos um medicamento.");
    }

    if (!dadosPrescricao.funcionarioId) {
      const funcionarioDefault = await this.prescricaoDAO.buscarPrimeiroFuncionarioVet();
      if (!funcionarioDefault) {
        throw new Error("Nenhum veterinário disponível para prescrição.");
      }
      dadosPrescricao.funcionarioId = funcionarioDefault.idFuncionario;
    }

    const deducoesPendentes = [];

    for (const linha of dadosPrescricao.linhas) {
      if (linha.dosagem <= 0 || linha.totalDoses <= 0) {
        throw new Error("A dosagem e o total de doses devem ser superiores a zero.");
      }

      const stockItem = await this.stockDAO.findItemPorNome(linha.medicamentoId);
      
      if (!stockItem || !stockItem.medicamento) {
        throw new Error(`Medicamento '${linha.medicamentoId}' não encontrado no stock.`);
      }

      const quantidadeTotalGasta = linha.dosagem * linha.totalDoses;

      if (stockItem.quantidade < quantidadeTotalGasta) {
        throw new Error(`Stock insuficiente para '${stockItem.nome}'. O tratamento total precisa de ${quantidadeTotalGasta}, mas o stock atual é ${stockItem.quantidade}.`);
      }

      linha.medicamentoId = stockItem.medicamento.idMedicamento;

      deducoesPendentes.push({
        stockId: stockItem.idItem,
        novaQuantidade: stockItem.quantidade - quantidadeTotalGasta
      });
    }

    const novaPrescricao = await this.prescricaoDAO.create(dadosPrescricao);

    for (const deducao of deducoesPendentes) {
      await this.stockDAO.updateQuantidade(deducao.stockId, deducao.novaQuantidade);
    }

    return novaPrescricao;
  }

  async listarStockCompleto() {
    return await this.stockDAO.findAll();
  }

  async reforcarStock(idItem: string, quantidadeAdicionada: number) {
    if (quantidadeAdicionada <= 0) throw new Error("A quantidade a adicionar deve ser maior que zero.");
    const item = await this.stockDAO.findById(idItem);
    if (!item) throw new Error("Item de stock não encontrado.");
    const novaQuantidade = item.quantidade + quantidadeAdicionada;
    return await this.stockDAO.updateQuantidade(idItem, novaQuantidade);
  }

  // ==========================================
  // GESTÃO DE CHECKS DIÁRIOS E QUARENTENA
  // ==========================================

  // 👇 CORREÇÃO: Recebe o nomeVet e passa para o DAO
  async registarCheckDiario(idAnimal: string, notas: string, nomeVet: string = 'Veterinário(a)') {
    if (!notas || notas.trim().length === 0) {
      throw new Error("O check deve incluir notas do veterinário.");
    }
    return await this.prescricaoDAO.registarCheckDiario(idAnimal, notas, nomeVet);
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

  // ==========================================
  // GESTÃO DE TRATAMENTOS E LOGS
  // ==========================================
  async listarTratamentosAtivos() {
    return await this.prescricaoDAO.listarTratamentosAtivos();
  }

  async registarAdministracao(idLinha: string, idFuncionario: string) {
    if (!idLinha || !idFuncionario) {
      throw new Error("Dados incompletos para registar administração.");
    }
    return await this.prescricaoDAO.registarAdministracao(idLinha, idFuncionario);
  }

  async finalizarTratamento(idLinha: string) {
    return await this.prescricaoDAO.finalizarTratamento(idLinha);
  }
}
import { FaturaDAO } from '../dao/FaturaDAO';
import { ReservaDAO } from '../dao/ReservaDAO';

export class GestFaturacaoFacade {
  private faturaDAO: FaturaDAO;
  private reservaDAO: ReservaDAO;

  constructor() {
    this.faturaDAO = new FaturaDAO();
    this.reservaDAO = new ReservaDAO();
  }

  // Regra de Negócio: Peak Pricing e Faturação (US11, RF.11 e R31)
  // Adicionámos o metodoPagamento com um valor por defeito para não quebrar outras rotas!
  async gerarFaturaFinal(idReserva: string, nifCliente: string, metodoPagamento: string = 'Não Definido') {
    // No futuro, o Gestor cruzaria as datas da reserva para aplicar a taxa de época alta (Verão/Natal)
    // e somaria o valor dos Banhos e Passeios. Para já, gravamos a fatura base.
    
    const valorCalculado = 150.00; // Exemplo de cálculo do motor

    return await this.faturaDAO.create({
      nifCliente: nifCliente,
      valorTotal: valorCalculado,
      documento: `FAT-${Date.now()}.pdf`, // Simula a geração do PDF certificado pela AT
      metodoPagamento: metodoPagamento    // <-- AQUI ESTÁ A CORREÇÃO!
    });
  }

  async listarFaturasDoTutor(nif: string) {
    return await this.faturaDAO.buscarPorTutor(nif);
  }
}
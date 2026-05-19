"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestReservasFacade = void 0;
const ReservaDAO_1 = require("../dao/ReservaDAO");
const AnimalDAO_1 = require("../dao/AnimalDAO");
const UtilizadorDAO_1 = require("../dao/UtilizadorDAO");
const StockDAO_1 = require("../dao/StockDAO");
const FaturaDAO_1 = require("../dao/FaturaDAO"); // NOVO: Para emitirmos faturas
const DiarioBordoDAO_1 = require("../dao/DiarioBordoDAO");
class GestReservasFacade {
    reservaDAO;
    animalDAO;
    utilizadorDAO;
    stockDAO;
    faturaDAO;
    constructor() {
        this.reservaDAO = new ReservaDAO_1.ReservaDAO();
        this.animalDAO = new AnimalDAO_1.AnimalDAO();
        this.utilizadorDAO = new UtilizadorDAO_1.UtilizadorDAO();
        this.stockDAO = new StockDAO_1.StockDAO();
        this.faturaDAO = new FaturaDAO_1.FaturaDAO();
    }
    // ==========================================
    // REGRAS DE NEGÓCIO: RESERVAS E TAREFAS
    // ==========================================
    async criarReserva(dadosReserva, servicosAntigos) {
        // 1. Apanhar os dados
        const { dataEntrada, dataSaida, banhos, tosquias, passeios, valor } = dadosReserva;
        const animalId = dadosReserva.idAnimal || dadosReserva.animalId;
        const entrada = new Date(dataEntrada);
        const saida = new Date(dataSaida);
        if (isNaN(entrada.getTime()) || isNaN(saida.getTime()) || saida <= entrada) {
            throw new Error("Datas inválidas. A data de saída deve ser posterior à entrada.");
        }
        const animalExiste = await this.animalDAO.findByIdWithHistorial(animalId);
        if (!animalExiste) {
            throw new Error("Animal não encontrado na base de dados.");
        }
        const reservaAtiva = await this.reservaDAO.findReservaAtivaDoAnimal(animalId);
        if (reservaAtiva) {
            throw new Error(`Este animal já possui uma reserva ativa (${reservaAtiva.estado}).`);
        }
        const reatividade = animalExiste.reatividade || 'Não Reativo';
        const boxAtribuida = await this.reservaDAO.atribuirBoxAutomaticamente(reatividade, entrada, saida);
        // ==============================================================
        // PASSO A: O GERADOR DE AGENDA AUTOMÁTICA
        // ==============================================================
        const servicosParaCriar = [];
        const diasTotais = Math.ceil((saida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24));
        let b = banhos || 0;
        let t = tosquias || 0;
        let p = passeios || 0;
        for (let i = 0; i < diasTotais; i++) {
            const dataAtual = new Date(entrada);
            dataAtual.setDate(entrada.getDate() + i);
            // Alimentação (19:00)
            const dataComida = new Date(dataAtual);
            dataComida.setHours(19, 0, 0, 0);
            servicosParaCriar.push({ tipo: 'Alimentacao', data: dataComida, preco: 0 });
            // Passeios (10:00)
            if (p > 0) {
                const dataPasseio = new Date(dataAtual);
                dataPasseio.setHours(10, 0, 0, 0);
                servicosParaCriar.push({ tipo: 'Passeio', data: dataPasseio, preco: 10 });
                p--;
            }
            // Banhos (15:00)
            if (b > 0) {
                const dataBanho = new Date(dataAtual);
                dataBanho.setHours(15, 0, 0, 0);
                servicosParaCriar.push({ tipo: 'Grooming', descricao: 'Banho', data: dataBanho, preco: 20 });
                b--;
            }
            // Tosquias (16:00)
            if (t > 0) {
                const dataTosquia = new Date(dataAtual);
                dataTosquia.setHours(16, 0, 0, 0);
                servicosParaCriar.push({ tipo: 'Grooming', descricao: 'Tosquia', data: dataTosquia, preco: 10 });
                t--;
            }
        }
        // ==============================================================
        // PASSO B: DIVISÃO EQUITATIVA (ROUND-ROBIN)
        // ==============================================================
        const equipaStaff = await this.utilizadorDAO.findByPerfil('Staff');
        if (equipaStaff.length > 0 && servicosParaCriar.length > 0) {
            let staffIndex = 0;
            servicosParaCriar.forEach(servico => {
                servico.funcionarioId = equipaStaff[staffIndex].idFuncionario;
                staffIndex = (staffIndex + 1) % equipaStaff.length;
            });
        }
        const reservaFinal = {
            animalId: animalId,
            dataEntrada: entrada,
            dataSaida: saida,
            estado: 'Pendente',
            boxNumero: boxAtribuida,
            valor: valor
        };
        return await this.reservaDAO.create(reservaFinal, servicosParaCriar);
    }
    async listarTodas() {
        return await this.reservaDAO.findAll();
    }
    // ==========================================
    // RECEÇÃO: CHECK-IN E CHECK-OUT INTELIGENTE
    // ==========================================
    async confirmarCheckIn(idReserva, termosAceites) {
        if (!termosAceites) {
            throw new Error("Não é possível realizar o Check-in sem a aceitação obrigatória dos Termos de Responsabilidade.");
        }
        // Chama o novo método que altera o estado e grava o termo!
        return await this.reservaDAO.processarCheckInDB(idReserva);
    }
    async processarCheckOutCompleto(idReserva, metodoPagamento) {
        if (!metodoPagamento)
            throw new Error("É obrigatório selecionar um método de pagamento.");
        const reserva = await this.reservaDAO.findByIdComAnimal(idReserva);
        if (!reserva)
            throw new Error("Reserva não encontrada.");
        const agora = new Date();
        let valorFinal = reserva.valor;
        let diasAtrasoOuAntecipacao = 0;
        // Cálculos à Meia-Noite
        const inicioReal = new Date(reserva.dataEntrada).setHours(0, 0, 0, 0);
        const fimPrevisto = new Date(reserva.dataSaida).setHours(0, 0, 0, 0);
        const saidaReal = agora.setHours(0, 0, 0, 0);
        const diasPrevistos = Math.max(1, Math.ceil((fimPrevisto - inicioReal) / (1000 * 60 * 60 * 24)));
        const diasReais = Math.max(1, Math.ceil((saidaReal - inicioReal) / (1000 * 60 * 60 * 24)));
        // REGRA DE NEGÓCIO: Recálculo de Preço Justo
        if (diasReais > diasPrevistos) {
            // ATRASO: Cobra +20€ por cada dia extra
            diasAtrasoOuAntecipacao = diasReais - diasPrevistos;
            valorFinal += (diasAtrasoOuAntecipacao * 20);
        }
        else if (diasReais < diasPrevistos) {
            // SAÍDA ANTECIPADA: Devolve 20€ por cada dia que o cão não usou!
            diasAtrasoOuAntecipacao = diasPrevistos - diasReais;
            valorFinal -= (diasAtrasoOuAntecipacao * 20);
            // Garantia que não devolvemos dinheiro de banhos já dados (Preço Mínimo)
            if (valorFinal < 0)
                valorFinal = 0;
        }
        const fatura = await this.faturaDAO.create({
            nifCliente: reserva.animal.tutorNif,
            valorTotal: valorFinal,
            documento: `FAT-${Date.now()}-${metodoPagamento}.pdf`,
            metodoPagamento: metodoPagamento
        });
        await this.reservaDAO.processarCheckOutDB(idReserva, valorFinal, fatura.idFaturas);
        return {
            fatura,
            diasReais,
            valorOriginal: reserva.valor,
            valorFinal
        };
    }
    async cancelarReserva(idReserva) {
        return await this.reservaDAO.updateEstado(idReserva, 'Cancelada');
    }
    async eliminarReserva(idReserva) {
        return await this.reservaDAO.delete(idReserva);
    }
    // ==========================================
    // GESTÃO DE TAREFAS (STAFF E RAÇÃO)
    // ==========================================
    async listarTarefasDoDia() {
        return await this.reservaDAO.findTarefasDoDia();
    }
    async listarTarefasPendentes() {
        return await this.reservaDAO.findTarefasPendentes();
    }
    async marcarTarefaConcluida(idServico, nomeStaff = 'Staff') {
        const servico = await this.reservaDAO.findById(idServico);
        if (!servico)
            throw new Error("Tarefa não encontrada.");
        // (A tua lógica de descontar a ração fica aqui...)
        const concluido = await this.reservaDAO.marcarConcluida(idServico);
        // 👇 A MÁGICA DO STAFF ENTRA AQUI 👇
        if (concluido.reserva?.animalId) {
            const diarioDAO = new DiarioBordoDAO_1.DiarioBordoDAO();
            await diarioDAO.create(`✅ [TAREFA CONCLUÍDA por ${nomeStaff}] O serviço de ${concluido.tipo} foi realizado.`, concluido.reserva.animalId);
        }
        return concluido;
    }
    async obterServicosFinalizadosHoje(idAnimal) {
        return await this.reservaDAO.findFinalizadosPorAnimalEDia(idAnimal);
    }
}
exports.GestReservasFacade = GestReservasFacade;

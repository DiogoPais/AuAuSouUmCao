"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservaDAO = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ReservaDAO {
    // Vai buscar todas as reservas (Usado pela Receção para listar e faturar)
    async findAll() {
        return await prisma.reserva.findMany({
            include: {
                animal: {
                    include: {
                        tutor: { include: { utilizador: true } },
                        planoVacinal: true
                    }
                },
                box: true,
                servicos: true,
                fatura: true
            },
            orderBy: { dataEntrada: 'desc' }
        });
    }
    // Verifica se o animal já está hospedado ou tem reserva marcada
    async findReservaAtivaDoAnimal(idAnimal) {
        return await prisma.reserva.findFirst({
            where: {
                animalId: idAnimal,
                estado: { in: ['Pendente', 'CheckIn'] }
            }
        });
    }
    // A BASE PARA IMPEDIR OVERBOOKING: Procura reservas que se cruzam com as datas pedidas
    async findReservasNoPeriodo(entrada, saida) {
        return await prisma.reserva.findMany({
            where: {
                estado: { in: ['Pendente', 'CheckIn'] },
                AND: [
                    { dataEntrada: { lt: saida } },
                    { dataSaida: { gt: entrada } }
                ]
            }
        });
    }
    // Traz a lista de todas as boxes (Para o sistema saber a lotação máxima)
    async findAllBoxes() {
        return await prisma.box.findMany();
    }
    // Grava a nova reserva e os serviços extra de uma só vez
    async create(dadosReserva, servicosAdicionais) {
        return await prisma.reserva.create({
            data: {
                ...dadosReserva,
                servicos: servicosAdicionais.length > 0 ? {
                    create: servicosAdicionais
                } : undefined
            },
            include: { animal: true, box: true, servicos: true }
        });
    }
    // Atualiza o estado (Pendente -> CheckIn -> CheckOut ou Cancelada)
    async updateEstado(idReserva, novoEstado) {
        return await prisma.reserva.update({
            where: { idReserva },
            data: { estado: novoEstado }
        });
    }
    // Apaga a reserva da base de dados
    async delete(idReserva) {
        // Primeiro apaga os serviços ligados para não dar erro de Chave Estrangeira
        await prisma.servico.deleteMany({ where: { reservaId: idReserva } });
        return await prisma.reserva.delete({ where: { idReserva } });
    }
    // ==========================================
    // NOVOS MÉTODOS: VALIDAÇÃO E ATRIBUIÇÃO DE BOXES
    // ==========================================
    // Conta quantos animais estão agendados numa box específica num período
    async contarAnimaisEmBox(numeroBox, entrada, saida) {
        const reservasNaBox = await prisma.reserva.findMany({
            where: {
                boxNumero: numeroBox,
                estado: { in: ['Pendente', 'CheckIn'] },
                AND: [
                    { dataEntrada: { lt: saida } },
                    { dataSaida: { gt: entrada } }
                ]
            }
        });
        return reservasNaBox.length; // 1 reserva = 1 animal (modelo simplificado)
    }
    // Valida se há espaço na box e se está em condição de usar
    async verificarCapacidadeBox(numeroBox, entrada, saida) {
        const box = await prisma.box.findUnique({
            where: { numero: numeroBox }
        });
        if (!box) {
            return { disponivel: false, motivo: `Box ${numeroBox} não existe.` };
        }
        // Valida se a box está higienizada
        if (box.estado !== 'Higienizada') {
            return {
                disponivel: false,
                motivo: `Box ${numeroBox} está ${box.estado} - não disponível para check-in.`
            };
        }
        // Conta quantos animais já estão nesta box no período pedido
        const animaisJaLa = await this.contarAnimaisEmBox(numeroBox, entrada, saida);
        const espacosLivres = box.tamanho - animaisJaLa;
        if (espacosLivres <= 0) {
            return {
                disponivel: false,
                motivo: `Box ${numeroBox} está cheia (${animaisJaLa}/${box.tamanho} espaços).`
            };
        }
        return {
            disponivel: true,
            espacosLivres,
            tamanho: box.tamanho,
            ocupacao: animaisJaLa
        };
    }
    // Atribui automaticamente uma box baseado na reatividade do animal
    // Regra: 1/4 das boxes para reativos, 3/4 para não-reativos
    async atribuirBoxAutomaticamente(reatividade, entrada, saida) {
        const todasBoxes = await prisma.box.findMany({ orderBy: { numero: 'asc' } });
        if (todasBoxes.length === 0) {
            throw new Error("Nenhuma box disponível no sistema.");
        }
        // Calcula o limite: 1/4 para reativos
        const limitReativos = Math.ceil(todasBoxes.length / 4);
        const boxesReativos = todasBoxes.slice(0, limitReativos);
        const boxesNaoReativos = todasBoxes.slice(limitReativos);
        // Define qual categoria de boxes procurar
        const categoriaPreferida = reatividade === 'Reativo' ? boxesReativos : boxesNaoReativos;
        const categoriaAlternativa = reatividade === 'Reativo' ? boxesNaoReativos : boxesReativos;
        // Tenta atribuir numa box da categoria preferida
        for (const box of categoriaPreferida) {
            const validacao = await this.verificarCapacidadeBox(box.numero, entrada, saida);
            if (validacao.disponivel) {
                return box.numero; // Box atribuída!
            }
        }
        // Se não houver espaço na categoria preferida, procura na alternativa
        for (const box of categoriaAlternativa) {
            const validacao = await this.verificarCapacidadeBox(box.numero, entrada, saida);
            if (validacao.disponivel) {
                return box.numero; // Box atribuída (categoria diferente)
            }
        }
        // Se chegou aqui, hotel está cheio
        throw new Error("OVERBOOKING: Nenhuma box disponível para este período.");
    }
    async findTarefasDoDia() {
        const hoje = new Date();
        const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
        const fimDia = new Date(hoje.setHours(23, 59, 59, 999));
        return await prisma.servico.findMany({
            where: {
                data: {
                    gte: inicioDia,
                    lte: fimDia,
                },
                estado: 'Pendente', // Apenas tarefas que o Staff ainda não fez
                // 👇 A CORREÇÃO ENTRA AQUI 👇
                reserva: {
                    estado: 'CheckIn' // Garante que o animal já está fisicamente no hotel!
                }
            },
            include: {
                reserva: {
                    include: {
                        animal: true
                    }
                }
            }
        });
    }
    // Busca todas as tarefas pendentes
    async findTarefasPendentes() {
        return await prisma.servico.findMany({
            where: {
                estado: { in: ['Pendente', 'Feito'] }
            },
            include: {
                reserva: {
                    include: {
                        animal: true,
                        box: true
                    }
                }
            },
            orderBy: { data: 'asc' }
        });
    }
    // Marca uma tarefa como concluída
    async marcarConcluida(idServico) {
        return await prisma.servico.update({
            where: { idServico },
            data: { estado: 'Finalizado' },
            include: {
                reserva: {
                    include: {
                        animal: true,
                        box: true
                    }
                }
            }
        });
    }
    // Atualiza o estado de um serviço
    async updateEstadoServico(idServico, novoEstado) {
        return await prisma.servico.update({
            where: { idServico },
            data: { estado: novoEstado }
        });
    }
    // Busca um serviço específico
    async findById(idServico) {
        return await prisma.servico.findUnique({
            where: { idServico },
            include: {
                reserva: {
                    include: {
                        animal: true,
                        box: true
                    }
                }
            }
        });
    }
    // Busca serviços finalizados de um animal num dia
    async findFinalizadosPorAnimalEDia(idAnimal) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);
        return await prisma.servico.findMany({
            where: {
                reserva: {
                    animalId: idAnimal
                },
                estado: 'Finalizado',
                data: {
                    gte: hoje,
                    lt: amanha
                }
            },
            orderBy: { data: 'asc' }
        });
    }
}
exports.ReservaDAO = ReservaDAO;

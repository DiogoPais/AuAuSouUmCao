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
    // Valida se a box está LIMPA e VAZIA (Sem cães nesse período)
    async verificarCapacidadeBox(numeroBox, entrada, saida) {
        const box = await prisma.box.findUnique({
            where: { numero: numeroBox }
        });
        if (!box) {
            return { disponivel: false, motivo: `Box ${numeroBox} não existe.` };
        }
        // REGRA DE NEGÓCIO: Só entra se estiver Limpa
        if (box.estado === 'Suja') {
            return { disponivel: false, motivo: `Box ${numeroBox} aguarda limpeza.` };
        }
        // REGRA DE NEGÓCIO: 1 Cão por Box. Se a query devolver alguma reserva no período, está ocupada.
        const conflitos = await prisma.reserva.count({
            where: {
                boxNumero: numeroBox,
                estado: { in: ['Pendente', 'CheckIn'] },
                AND: [
                    { dataEntrada: { lt: saida } },
                    { dataSaida: { gt: entrada } }
                ]
            }
        });
        if (conflitos >= 1) {
            return { disponivel: false, motivo: `Box ${numeroBox} já está ocupada neste período.` };
        }
        return { disponivel: true, tipo: box.tipo };
    }
    // O NOVO ALGORITMO DE DISTRIBUIÇÃO (Baseado no 'tipo' real da BD e não em % matemáticas)
    async atribuirBoxAutomaticamente(reatividade, entrada, saida) {
        // Traz todas as boxes ordenadas
        const boxes = await prisma.box.findMany({ orderBy: { numero: 'asc' } });
        if (boxes.length === 0) {
            throw new Error("Nenhuma box disponível no sistema.");
        }
        // Filtramos os nossos lotes (As 40 boxes que vais criar na BD)
        const naoReativas = boxes.filter(b => b.tipo === 'Não-Reativo');
        const reativas = boxes.filter(b => b.tipo === 'Reativo');
        // Define a prioridade com base na agressividade do cão
        const preferidas = reatividade === 'Reativo' ? reativas : naoReativas;
        const alternativas = reatividade === 'Reativo' ? naoReativas : reativas;
        // 1ª Tentativa: Tenta colocar na área correta
        for (const box of preferidas) {
            const validacao = await this.verificarCapacidadeBox(box.numero, entrada, saida);
            if (validacao.disponivel) {
                return box.numero; // Box atribuída!
            }
        }
        // 2ª Tentativa (O Fallback): Se não há, vai para o "último possível" da área oposta
        for (const box of alternativas) {
            const validacao = await this.verificarCapacidadeBox(box.numero, entrada, saida);
            if (validacao.disponivel) {
                return box.numero; // Box atribuída!
            }
        }
        // Se chegou aqui, hotel está cheio nas datas pedidas
        throw new Error("OVERBOOKING: O Hotel está com lotação esgotada para o período selecionado.");
    }
    // ==========================================
    // TAREFAS DO STAFF
    // ==========================================
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
                estado: 'Pendente',
                reserva: {
                    estado: 'CheckIn' // Garante que o animal já está fisicamente no hotel
                }
            },
            include: {
                reserva: {
                    include: {
                        animal: true,
                        box: true // 👇 A ÚNICA PALAVRA QUE FALTAVA PARA O MAPA FUNCIONAR! 👇
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
                reserva: { animalId: idAnimal },
                estado: 'Finalizado',
                data: { gte: hoje, lt: amanha }
            },
            orderBy: { data: 'asc' }
        });
    }
    // ==========================================
    // FATURAÇÃO E CHECK-OUT
    // ==========================================
    // Busca uma reserva específica com os dados do Animal para podermos faturar
    async findByIdComAnimal(idReserva) {
        return await prisma.reserva.findUnique({
            where: { idReserva },
            include: { animal: true }
        });
    }
    // 🐛 FIX BUGS 7: TIRAR DA QUARENTENA NO CHECK-OUT E SUJAR BOX
    async processarCheckOutDB(idReserva, valorFinal, idFatura) {
        const reserva = await prisma.reserva.findUnique({
            where: { idReserva },
            include: { animal: true } // Precisamos do animal para ver a saúde dele
        });
        if (reserva) {
            // 1. Suja a Box à espera do Staff
            await prisma.box.update({
                where: { numero: reserva.boxNumero },
                data: { estado: 'Suja' }
            });
            // 2. [BUG 7 RESOLVIDO]: Dá "Alta" automática se ele estava em Quarentena!
            if (reserva.animal.estado === 'Quarentena') {
                await prisma.animal.update({
                    where: { idAnimal: reserva.animalId },
                    data: { estado: 'Saudavel' }
                });
                // (Opcional) Regista no diário de bordo que a quarentena acabou porque o dono o levou
                await prisma.diarioBordo.create({
                    data: {
                        descricao: `✅ [ALTA AUTOMÁTICA] O animal saiu do hotel (Check-Out), logo a quarentena médica foi encerrada no sistema.`,
                        reservaId: reserva.idReserva
                    }
                });
            }
        }
        return await prisma.reserva.update({
            where: { idReserva },
            data: {
                estado: 'CheckOut',
                valor: valorFinal,
                faturaId: idFatura
            }
        });
    }
    // 🐛 FIX BUG 6: FORÇAR A VET A VER O CÃO NOVO
    async processarCheckInDB(idReserva) {
        const reserva = await prisma.reserva.findUnique({ where: { idReserva } });
        if (reserva) {
            // [BUG 6 RESOLVIDO]: Assim que entra no hotel, a flag de verificação volta a falso!
            await prisma.animal.update({
                where: { idAnimal: reserva.animalId },
                data: { check: false }
            });
        }
        return await prisma.reserva.update({
            where: { idReserva },
            data: {
                estado: 'CheckIn',
                termoAceite: true
            }
        });
    }
    // ==========================================
    // MANUTENÇÃO DE BOXES
    // ==========================================
    async findBoxesSujas() {
        return await prisma.box.findMany({
            where: { estado: 'Suja' },
            orderBy: { numero: 'asc' }
        });
    }
    async marcarBoxComoLimpa(numeroBox) {
        return await prisma.box.update({
            where: { numero: numeroBox },
            data: { estado: 'Limpa' }
        });
    }
}
exports.ReservaDAO = ReservaDAO;

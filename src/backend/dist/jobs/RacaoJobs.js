"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.iniciarJobsDeRacao = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const iniciarJobsDeRacao = () => {
    // Função que alimenta os cães
    const alimentarCaes = async (refeicao) => {
        console.log(`[CRON JOB RAÇÃO] A preparar a refeição do ${refeicao}...`);
        try {
            // 1. Contar quantos cães estão em CheckIn neste momento
            const caesHospedados = await prisma.reserva.count({
                where: { estado: 'CheckIn' }
            });
            if (caesHospedados === 0) {
                console.log('[CRON JOB RAÇÃO] Nenhum cão hospedado. Não se gastou ração.');
                return;
            }
            // 2. Gastamos 250g (0.25kg) por cão em cada refeição (Almoço ou Jantar)
            const quantidadeAGastar = Math.ceil(caesHospedados * 0.25);
            // 3. Procurar o stock da Ração Base (podes afinar isto para procurar pelo nome ou ID correto)
            const racaoStock = await prisma.stock.findFirst({
                where: { racao: { isNot: null }, nome: { contains: 'Premium' } }
            });
            if (racaoStock) {
                const novaQuantidade = racaoStock.quantidade - quantidadeAGastar;
                await prisma.stock.update({
                    where: { idItem: racaoStock.idItem },
                    data: { quantidade: Math.max(0, novaQuantidade) } // Garante que não fica negativo
                });
                console.log(`[CRON JOB RAÇÃO] Sucesso! ${caesHospedados} cães alimentados. Foram gastos ${quantidadeAGastar}kg de ração.`);
            }
        }
        catch (error) {
            console.error('[CRON JOB ERRO] Falha ao descontar ração:', error);
        }
    };
    // '0 12 * * *' = Correr todos os dias às 12:00
    node_cron_1.default.schedule('0 12 * * *', () => alimentarCaes('Almoço'));
    // '0 20 * * *' = Correr todos os dias às 20:00
    node_cron_1.default.schedule('0 20 * * *', () => alimentarCaes('Jantar'));
    console.log('🕒 Cron Jobs de Ração inicializados (Almoço às 12h e Jantar às 20h).');
};
exports.iniciarJobsDeRacao = iniciarJobsDeRacao;

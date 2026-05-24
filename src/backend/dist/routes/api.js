"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const multer_1 = __importDefault(require("multer"));
const GestorHotelFacade_1 = require("../core/GestorHotelFacade");
const auth_1 = require("../middleware/auth");
const S3StorageAdapter_1 = require("../adapters/S3StorageAdapter");
const EmailService_1 = require("../services/EmailService");
const TwoFactorService_1 = require("../services/TwoFactorService");
const router = (0, express_1.Router)();
const gestor = new GestorHotelFacade_1.GestorHotelFacade();
const s3Adapter = new S3StorageAdapter_1.S3StorageAdapter();
// Multer usa a RAM para não encher o disco da AWS
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// ==========================================
// 1. ROTAS PÚBLICAS (Sem tranca)
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, nif, telemovel, password } = req.body;
        const saltRounds = 10;
        const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
        const novoUser = await gestor.criarConta(username, email, hashedPassword, nif, telemovel);
        res.status(201).json({ message: 'Conta criada com sucesso!', user: novoUser });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const utilizador = await gestor.buscarUtilizador(username);
        if (!utilizador || !(await bcrypt_1.default.compare(password, utilizador.password))) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        if (utilizador.tutor) {
            // Gerar código 2FA
            const code = (0, TwoFactorService_1.generate2FACode)();
            (0, TwoFactorService_1.store2FACode)(utilizador.email, code);
            // Enviar email com o código
            try {
                const emailTexto = `O seu código de confirmação é: ${code}. Este código expira em 10 minutos.`;
                const emailHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; text-align: center; border: 1px solid #eaeaea; border-radius: 10px; padding: 30px; color: #333;">
            <h2 style="color: #333;">Verificação de Segurança</h2>
            <p style="font-size: 16px;">Olá!</p>
            <p style="font-size: 16px;">Alguém tentou iniciar sessão na sua conta <strong>AuAuSouUmCão</strong>. Utilize o código abaixo para confirmar a sua identidade:</p>
            <div style="margin: 30px 0;">
              <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #333; background-color: #f4f4f4; padding: 20px 30px; border-radius: 8px; border: 2px dashed #7DDFD3;">
                ${code}
              </span>
            </div>
            <p style="color: #888; font-size: 14px;">Este código é válido durante <strong>10 minutos</strong>.</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="color: #aaa; font-size: 12px;">Se não tentou iniciar sessão, ignore este email.</p>
          </div>
        `;
                await (0, EmailService_1.sendEmail)(utilizador.email, 'Código de Confirmação 2FA - AuAuSouUmCão', emailTexto, emailHTML);
            }
            catch (emailError) {
                console.error('Erro ao enviar email:', emailError);
                return res.status(500).json({ error: 'Erro ao enviar código de confirmação.' });
            }
            res.status(200).json({
                requires2FA: true,
                email: utilizador.email,
                message: 'Código de confirmação enviado para o seu email.'
            });
        }
        else {
            // Quando criamos verificacao com email reais para o staff e tal
            const utilizadorR = await gestor.obterUtilizadorPorEmail(username);
            if (!utilizadorR) {
                return res.status(404).json({ error: 'Utilizador não encontrado.' });
            }
            const roleReal = utilizadorR.funcionario ? utilizadorR.funcionario.perfil : 'Tutor';
            const token = jsonwebtoken_1.default.sign({ userId: utilizadorR.idUtilizador, role: roleReal }, process.env.JWT_SECRET || 'chave_secreta_hotel_canino_2026', { expiresIn: '8h' });
            res.status(200).json({
                message: `Bem-vindo, ${utilizadorR.nome}!`,
                token, role: roleReal, nome: utilizadorR.nome,
                userId: utilizadorR.idUtilizador,
                nif: utilizadorR.tutor?.nif || '---'
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});
router.post('/verify-2fa', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!(0, TwoFactorService_1.verify2FACode)(email, code)) {
            return res.status(401).json({ error: 'Código inválido ou expirado.' });
        }
        // Buscar utilizador novamente para gerar token
        const utilizador = await gestor.obterUtilizadorPorEmail(email);
        if (!utilizador) {
            return res.status(404).json({ error: 'Utilizador não encontrado.' });
        }
        const roleReal = utilizador.funcionario ? utilizador.funcionario.perfil : 'Tutor';
        const token = jsonwebtoken_1.default.sign({ userId: utilizador.idUtilizador, role: roleReal }, process.env.JWT_SECRET || 'chave_secreta_hotel_canino_2026', { expiresIn: '8h' });
        res.status(200).json({
            message: `Bem-vindo, ${utilizador.nome}!`,
            token, role: roleReal, nome: utilizador.nome,
            userId: utilizador.idUtilizador,
            nif: utilizador.tutor?.nif || '---'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});
// ==========================================
// BARREIRA DE SEGURANÇA (JWT)
// ==========================================
router.use(auth_1.authMiddleware);
// ==========================================
// 2. ROTAS PROTEGIDAS
// ==========================================
router.get('/documentos/ver', async (req, res) => {
    try {
        const chave = req.query.chave;
        if (!chave)
            return res.status(400).json({ error: "Chave não fornecida." });
        const urlTemporaria = await s3Adapter.gerarLinkTemporario(chave);
        res.json({ url: urlTemporaria });
    }
    catch (error) {
        res.status(404).json({ error: "Documento não encontrado ou acesso expirado." });
    }
});
// ANIMAIS
router.get('/animais', async (req, res) => {
    const animais = await gestor.listarAnimais();
    res.json(animais);
});
router.get('/animais/tutor/:nif', async (req, res) => {
    const animais = await gestor.listarAnimaisTutor(req.params.nif);
    res.json(animais);
});
// --- ROTA DE UPLOAD PARA O S3 ---
router.post('/animais', upload.single('vacinasFile'), async (req, res) => {
    try {
        const uploadedFile = req.file;
        let s3Referencia = undefined;
        if (uploadedFile) {
            s3Referencia = await s3Adapter.uploadFicheiro(uploadedFile.originalname, uploadedFile.buffer, uploadedFile.mimetype, 'documentos');
        }
        const { boletimVacinasUrl, ...dadosLimposParaA_BD } = req.body;
        if (dadosLimposParaA_BD.doseDiaria) {
            dadosLimposParaA_BD.doseDiaria = parseFloat(dadosLimposParaA_BD.doseDiaria);
        }
        const novoAnimal = await gestor.registarAnimal(dadosLimposParaA_BD, uploadedFile ? {
            dataUltimaVacina: new Date(),
            documento: s3Referencia
        } : undefined);
        res.status(201).json(novoAnimal);
    }
    catch (error) {
        console.error("Erro ao adicionar animal:", error);
        res.status(400).json({ error: error.message });
    }
});
router.get('/animais/:id/servicos-finalizados', async (req, res) => {
    try {
        const servicos = await gestor.obterServicosFinalizadosHoje(req.params.id);
        res.json(servicos);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// RESERVAS
router.get('/reservas', async (req, res) => {
    const reservas = await gestor.listarReservas();
    res.json(reservas);
});
router.post('/reservas', async (req, res) => {
    try {
        // 👇 SOLUÇÃO DOS SERVIÇOS DO STAFF: Não extraímos os banhos aqui.
        // Assim eles passam diretamente dentro de "resto" (dadosReserva) para a Facade!
        const { idAnimal, ...resto } = req.body;
        const dadosReserva = { ...resto, animalId: idAnimal };
        const reserva = await gestor.efetuarReserva(dadosReserva, []);
        res.status(201).json(reserva);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// ROTA DO CHECK-IN
router.patch('/reservas/:id/checkin', async (req, res) => {
    try {
        const { termosAceites } = req.body;
        const result = await gestor.checkIn(req.params.id, termosAceites);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// ROTA DO CHECK-OUT
router.patch('/reservas/:id/checkout', async (req, res) => {
    try {
        const { metodoPagamento } = req.body;
        const result = await gestor.checkOut(req.params.id, metodoPagamento);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.patch('/reservas/:id/cancelar', async (req, res) => {
    try {
        const r = await gestor.cancelarReserva(req.params.id);
        res.json(r);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.patch('/plano-vacinal/:idAnimal', async (req, res) => {
    try {
        const { dataUltimaVacina, isValido, estado } = req.body;
        const planoAtualizado = await gestor.atualizarPlanoVacinal(req.params.idAnimal, {
            dataUltimaVacina: dataUltimaVacina ? new Date(dataUltimaVacina) : undefined,
            isValido: isValido ?? false,
            estado: estado || 'Valido'
        });
        res.json(planoAtualizado);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// TAREFAS (STAFF)
router.get('/tarefas', async (req, res) => {
    try {
        const tarefas = await gestor.listarTarefasDoDia();
        res.json(tarefas);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.patch('/tarefas/:id/concluir', upload.single('fotoProva'), async (req, res) => {
    try {
        // 👇 Garantimos um nome padrão caso o frontend falhe
        const nomeStaff = req.body.nomeStaff || 'Staff';
        const uploadedFile = req.file;
        let fotoUrl = undefined;
        // A TUA LÓGICA ORIGINAL PARA A AWS S3 (MANTIDA!)
        if (uploadedFile) {
            fotoUrl = await s3Adapter.uploadFicheiro(uploadedFile.originalname, uploadedFile.buffer, uploadedFile.mimetype, 'diario' // Guarda na pasta 'diario' da nuvem
            );
        }
        const tarefa = await gestor.marcarTarefaConcluida(req.params.id, nomeStaff, fotoUrl);
        res.json(tarefa);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/tarefas/limpezas', async (req, res) => {
    try {
        const sujas = await gestor.listarBoxesSujas();
        res.json(sujas);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.patch('/tarefas/limpezas/:numero', async (req, res) => {
    try {
        const boxLimpa = await gestor.limparBox(Number(req.params.numero));
        res.json(boxLimpa);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/funcionarios/count', async (req, res) => {
    try {
        const total = await gestor.contarFuncionarios();
        res.json({ total });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/funcionarios', async (req, res) => {
    try {
        const funcionarios = await gestor.listarFuncionarios();
        res.json(funcionarios);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/animais/:idAnimal/historial', async (req, res) => {
    try {
        const historial = await gestor.animalDiario(req.params.idAnimal);
        res.json(historial);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/animais/:idAnimal/servicos-finalizados', async (req, res) => {
    try {
        const servicos = await gestor.listarServicosFinalizados(req.params.idAnimal);
        res.json(servicos);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// ==========================================
// VETERINÁRIA
// ==========================================
router.get('/veterinaria/caes-para-verificar', async (req, res) => {
    try {
        const caes = await gestor.listarCaesParaVerificar();
        res.json(caes);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/veterinaria/caes-quarentena', async (req, res) => {
    try {
        const caes = await gestor.listarEmQuarentena();
        res.json(caes);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/veterinaria/check-diario/:idAnimal', async (req, res) => {
    try {
        // 👇 SOLUÇÃO ASSINATURAS NOS LOGS (VET)
        const { notas, nomeVet } = req.body;
        await gestor.registarCheckDiario(req.params.idAnimal, notas, nomeVet);
        res.status(201).json({ message: 'Check diário registado com sucesso' });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.patch('/veterinaria/quarentena/:idAnimal', async (req, res) => {
    try {
        const { motivo, ativar } = req.body;
        let resultado;
        if (ativar) {
            resultado = await gestor.ativarQuarentena(req.params.idAnimal, motivo);
        }
        else {
            resultado = await gestor.desativarQuarentena(req.params.idAnimal);
        }
        res.json(resultado);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/veterinaria/prescricao', async (req, res) => {
    try {
        const prescricao = await gestor.prescreverMedicacao(req.body);
        res.status(201).json(prescricao);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/veterinaria/prescricoes/:animalId', async (req, res) => {
    try {
        const prescricoes = await gestor.listarPrescricoesAnimal(req.params.animalId);
        res.json(prescricoes);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// ==========================================
// STOCK E INVENTÁRIO
// ==========================================
router.get('/stock', async (req, res) => {
    try {
        const stock = await gestor.listarStock();
        const stockFormatado = stock.map(s => ({
            idItem: s.idItem,
            nome: s.nome,
            quantidade: s.quantidade,
            tipo: s.medicamento ? 'Medicamento' : 'Racao',
            idMedicamento: s.medicamento?.idMedicamento || null,
            idRacao: s.racao?.idRacao || null
        }));
        res.json(stockFormatado);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.patch('/stock/:idItem/reforcar', async (req, res) => {
    try {
        const { quantidade } = req.body;
        const itemAtualizado = await gestor.reforcarStock(req.params.idItem, Number(quantidade));
        res.json(itemAtualizado);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/veterinaria/tratamentos-ativos', async (req, res) => {
    try {
        const tratamentos = await gestor.listarTratamentosAtivos();
        res.json(tratamentos);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/veterinaria/tratamentos/:idLinha/administrar', async (req, res) => {
    try {
        const idFuncionario = req.user?.userId || req.body.funcionarioId;
        if (!idFuncionario) {
            return res.status(400).json({ error: "ID do funcionário não fornecido." });
        }
        const log = await gestor.registarAdministracaoMedicamento(req.params.idLinha, idFuncionario);
        res.status(201).json({ message: 'Medicação registada com sucesso!', log });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.patch('/veterinaria/tratamentos/:idLinha/finalizar', async (req, res) => {
    try {
        const tratamento = await gestor.finalizarTratamento(req.params.idLinha);
        res.json({ message: 'Tratamento concluído!', tratamento });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// ==========================================
// ROTAS DA GESTORA
// ==========================================
router.get('/faturas', async (req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const faturas = await prisma.faturas.findMany({ orderBy: { idFaturas: 'desc' } });
        res.json(faturas);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/logs', async (req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const logs = await prisma.diarioBordo.findMany({
            include: {
                reserva: {
                    include: { animal: true }
                }
            },
            orderBy: { timestamp: 'desc' }
        });
        res.json(logs);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/faturas/tutor/:nif', async (req, res) => {
    try {
        // Busca as faturas que pertencem ao NIF do tutor
        const faturas = await gestor.listarFaturasDoTutor(req.params.nif);
        res.json(faturas);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;

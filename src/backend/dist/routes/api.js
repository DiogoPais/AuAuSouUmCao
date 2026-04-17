"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// 1. Efetuar Nova Reserva
router.post('/reservas', (req, res) => {
    const dadosReserva = req.body;
    // Como é mock, assumimos que corre sempre bem
    res.status(201).json({
        sucesso: true,
        idReserva: "RES-1045",
        boxesSugeridas: [12, 14],
        valorTotal: 150.00,
        mensagem: "Reserva efetuada com sucesso (Mock)"
    });
});
// 2. Consultar Historial e Diário de Bordo
router.get('/animais/:idAnimal/historial', (req, res) => {
    const { idAnimal } = req.params;
    res.status(200).json({
        idAnimal: idAnimal,
        nome: "Bobi",
        estadoClinico: "Saudável",
        diarioBordo: [
            {
                dataHora: new Date().toISOString(),
                descricao: "Passeio matinal concluído com muita energia!",
                fotoUrl: "https://aws-s3-bucket/fotos/mock-bobi.jpg"
            }
        ]
    });
});
// 3. Registar Execução de Tarefa (Staff)
router.patch('/operacoes/tarefas/:idTarefa', (req, res) => {
    const { idTarefa } = req.params;
    const { estado } = req.body;
    res.status(200).json({
        sucesso: true,
        idTarefa: idTarefa,
        estadoNovo: estado || "Concluída",
        mensagem: "Tarefa atualizada com sucesso!"
    });
});
// 4. Gerar e Obter Fatura Final
router.get('/faturacao/reservas/:idReserva/fatura', (req, res) => {
    const { idReserva } = req.params;
    res.status(200).json({
        idFatura: `FAT-${idReserva}`,
        nifCliente: "123456789",
        valorTotal: 150.00,
        linkDocumento: `https://aws-s3-bucket/faturas/FAT-${idReserva}.pdf`
    });
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🚀 A atualizar contas, criar animais e a semear as 40 novas boxes...');
    const saltRounds = 10;
    const hashedPass = await bcrypt_1.default.hash('password123', saltRounds);
    const hashedPassE = await bcrypt_1.default.hash('123', saltRounds);
    // ==========================================
    // 1. EQUIPA DO HOTEL E CLIENTE 
    // ==========================================
    await prisma.utilizador.upsert({
        where: { email: 'diana@auau.pt' },
        update: { password: hashedPass },
        create: {
            nome: 'Diana Silva', email: 'diana@auau.pt', password: hashedPass,
            funcionario: { create: { perfil: 'Admin' } }
        }
    });
    await prisma.utilizador.upsert({
        where: { email: 'vet@auau.pt' },
        update: { password: hashedPass },
        create: {
            nome: 'Dr. Carlos', email: 'vet@auau.pt', password: hashedPass,
            funcionario: { create: { perfil: 'Vet' } }
        }
    });
    await prisma.utilizador.upsert({
        where: { email: 'staff@auau.pt' },
        update: { password: hashedPass },
        create: {
            nome: 'João Cuidador', email: 'staff@auau.pt', password: hashedPass,
            funcionario: { create: { perfil: 'Staff' } }
        }
    });
    await prisma.utilizador.upsert({
        where: { email: 'rececao@auau.pt' },
        update: { password: hashedPass },
        create: {
            nome: 'Marta Rececionista', email: 'rececao@auau.pt', password: hashedPass,
            funcionario: { create: { perfil: 'Rececao' } }
        }
    });
    await prisma.utilizador.upsert({
        where: { email: 'tutor@auau.pt' },
        update: { password: hashedPass },
        create: {
            nome: 'João Tutor', email: 'tutor@auau.pt', password: hashedPass,
            tutor: { create: { nif: '123456789', contacto: '912345678' } }
        }
    });
    await prisma.utilizador.upsert({
        where: { email: 'hugoaraujocunha2005@gmail.com' },
        update: { password: hashedPassE },
        create: {
            nome: 'Hugo Cunha', email: 'hugoaraujocunha2005@gmail.com', password: hashedPassE,
            tutor: { create: { nif: '1250917019', contacto: '937712990' } }
        }
    });
    await prisma.utilizador.upsert({
        where: { email: 'dmpais1999@gmail.com' },
        update: { password: hashedPassE },
        create: {
            nome: 'Diogo Pais', email: 'dmpais1999@gmail.com', password: hashedPassE,
            tutor: { create: { nif: '123454321', contacto: '123454321' } }
        }
    });
    const animal = await prisma.animal.upsert({
        where: { microchip: 'CHIP-TESTE-001' },
        update: {},
        create: {
            nome: 'Bobby', raca: 'Labrador', reatividade: 'Não Reativo', microchip: 'CHIP-TESTE-001', estado: 'Saudavel',
            tutorNif: '123456789'
        }
    });
    // ==========================================
    // 2. A MAGIA DAS 40 BOXES
    // ==========================================
    console.log('📦 A configurar as regras das 40 boxes...');
    const boxes = [];
    for (let i = 1; i <= 20; i++)
        boxes.push({ numero: i, tipo: 'Não-Reativo', estado: 'Limpa' });
    for (let i = 21; i <= 30; i++)
        boxes.push({ numero: i, tipo: 'Reativo', estado: 'Limpa' });
    for (let i = 31; i <= 40; i++)
        boxes.push({ numero: i, tipo: 'Quarentena', estado: 'Limpa' });
    for (const b of boxes) {
        await prisma.box.upsert({
            where: { numero: b.numero },
            update: { tipo: b.tipo, estado: b.estado },
            create: b,
        });
    }
    await prisma.box.deleteMany({
        where: { numero: { gt: 40 } }
    });
    // ==========================================
    // 3. RESERVA DE TESTE COM DIÁRIO DE BORDO ATUALIZADO
    // ==========================================
    const reservaExistente = await prisma.reserva.findFirst({ where: { animalId: animal.idAnimal } });
    if (!reservaExistente) {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 5);
        await prisma.reserva.create({
            data: {
                dataEntrada: new Date(),
                dataSaida: amanha,
                valor: 100,
                estado: 'CheckIn',
                animalId: animal.idAnimal,
                boxNumero: 1,
                // 👇 AQUI ESTÁ A MAGIA! Criamos os logs de teste diretamente ligados à Reserva
                diarioBordo: {
                    create: [
                        { descricao: '🚨 [CHECK-IN] Avaliação inicial: O Bobby chegou um pouco ansioso, mas saudável.', fotos: [] },
                        { descricao: '✅ Alimentacao', fotos: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&q=80'] },
                        { descricao: '✅ Passeio higiénico matinal', fotos: [] }
                    ]
                }
            }
        });
        console.log('📝 Reserva e Diário de Bordo criados com sucesso!');
    }
    // ==========================================
    // 4. STOCK 
    // ==========================================
    console.log('🛒 A verificar e a semear o stock...');
    const semearStockSeguro = async (nomeItem, dadosCreate) => {
        const itemExiste = await prisma.stock.findFirst({ where: { nome: nomeItem } });
        if (!itemExiste) {
            await prisma.stock.create({ data: dadosCreate });
        }
    };
    await semearStockSeguro('Ração Premium Adultos', {
        nome: 'Ração Premium Adultos', quantidade: 50, limiteAlerta: 10, racao: { create: { marca: 'Royal Canin' } }
    });
    await semearStockSeguro('Ração Gastrointestinal', {
        nome: 'Ração Gastrointestinal', quantidade: 3, limiteAlerta: 5, racao: { create: { marca: 'Purina Pro Plan' } }
    });
    await semearStockSeguro('Flagyl 250mg', {
        nome: 'Flagyl 250mg', quantidade: 20, limiteAlerta: 5, medicamento: { create: { concentracao: 250 } }
    });
    console.log('✅ Base de Dados atualizada, segura e semeada com sucesso!');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

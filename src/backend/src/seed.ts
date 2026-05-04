import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 A atualizar contas, criar animais e a semear stock...');

  const saltRounds = 10;
  const hashedPass = await bcrypt.hash('password123', saltRounds);

  // ==========================================
  // 1. EQUIPA DO HOTEL
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

  // ==========================================
  // 2. CLIENTE E ANIMAL DE TESTE
  // ==========================================
  await prisma.utilizador.upsert({
    where: { email: 'tutor@auau.pt' },
    update: { password: hashedPass },
    create: {
      nome: 'João Tutor', email: 'tutor@auau.pt', password: hashedPass,
      tutor: { create: { nif: '123456789', contacto: '912345678' } }
    }
  });

  const box = await prisma.box.upsert({
    where: { numero: 1 },
    update: {},
    create: { numero: 1, tamanho: 2, ocupacao: 0, estado: 'Higienizada' }
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
  // 3. RESERVA (Para o Calendário e Cron Job)
  // ==========================================
  const reservaExistente = await prisma.reserva.findFirst({ where: { animalId: animal.idAnimal } });
  if (!reservaExistente) {
    const amanha = new Date(); 
    amanha.setDate(amanha.getDate() + 5);
    await prisma.reserva.create({
      data: {
        dataEntrada: new Date(), dataSaida: amanha, valor: 100, estado: 'CheckIn',
        animalId: animal.idAnimal, boxNumero: box.numero
      }
    });
  }

  // ==========================================
  // 4. STOCK: RAÇÃO E MEDICAMENTOS
  // ==========================================
  // Limpamos o stock existente para evitar duplicados caso corras o seed várias vezes
  await prisma.stock.deleteMany();

  // Ração Saudável (Sem alerta)
  await prisma.stock.create({
    data: {
      nome: 'Ração Premium Adultos', quantidade: 50, limiteAlerta: 10,
      racao: { create: { marca: 'Royal Canin' } }
    }
  });

  // Ração Baixa (Vai aparecer a VERMELHO na Gestora!)
  await prisma.stock.create({
    data: {
      nome: 'Ração Gastrointestinal', quantidade: 3, limiteAlerta: 5,
      racao: { create: { marca: 'Purina Pro Plan' } }
    }
  });

  // Medicamento
  await prisma.stock.create({
    data: {
      nome: 'Flagyl 250mg', quantidade: 20, limiteAlerta: 5,
      medicamento: { create: { concentracao: 250 } }
    }
  });

  console.log('✅ Base de Dados atualizada, segura e semeada com sucesso!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
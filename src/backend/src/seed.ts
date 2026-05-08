import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 A atualizar contas, criar animais e a semear as 40 novas boxes...');

  const saltRounds = 10;
  const hashedPass = await bcrypt.hash('password123', saltRounds);

  // ==========================================
  // 1. EQUIPA DO HOTEL E CLIENTE (O upsert não apaga nada, é seguro!)
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

  const animal = await prisma.animal.upsert({
    where: { microchip: 'CHIP-TESTE-001' },
    update: {},
    create: {
      nome: 'Bobby', raca: 'Labrador', reatividade: 'Não Reativo', microchip: 'CHIP-TESTE-001', estado: 'Saudavel',
      tutorNif: '123456789'
    }
  });

  // ==========================================
  // 2. A MAGIA DAS 40 BOXES (Sem apagar o passado)
  // ==========================================
  console.log('📦 A configurar as regras das 40 boxes...');

  const boxes = [];
  for (let i = 1; i <= 20; i++) boxes.push({ numero: i, tipo: 'Não-Reativo', estado: 'Limpa' });
  for (let i = 21; i <= 30; i++) boxes.push({ numero: i, tipo: 'Reativo', estado: 'Limpa' });
  for (let i = 31; i <= 40; i++) boxes.push({ numero: i, tipo: 'Quarentena', estado: 'Limpa' });

  for (const b of boxes) {
    await prisma.box.upsert({
      where: { numero: b.numero },
      update: { tipo: b.tipo, estado: b.estado }, // Se já existir (ex: Box 1), apenas atualiza para o novo formato!
      create: b,                                  // Se não existir, cria de raiz.
    });
  }

  // Se por acaso existirem boxes antigas com número superior a 40 (que já não queremos), apagamos essas.
  await prisma.box.deleteMany({
    where: { numero: { gt: 40 } }
  });

  // ==========================================
  // 3. RESERVA DE TESTE
  // ==========================================
  const reservaExistente = await prisma.reserva.findFirst({ where: { animalId: animal.idAnimal } });
  if (!reservaExistente) {
    const amanha = new Date(); 
    amanha.setDate(amanha.getDate() + 5);
    await prisma.reserva.create({
      data: {
        dataEntrada: new Date(), dataSaida: amanha, valor: 100, estado: 'CheckIn',
        animalId: animal.idAnimal, boxNumero: 1 // Forçamos a Box 1 para o teste
      }
    });
  }

  // ==========================================
  // 4. STOCK (Seguro e à prova de erros TypeScript!)
  // ==========================================
  console.log('🛒 A verificar e a semear o stock...');

  // Função auxiliar para contornar a falta do @unique no campo 'nome'
  const semearStockSeguro = async (nomeItem: string, dadosCreate: any) => {
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
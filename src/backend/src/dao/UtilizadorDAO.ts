import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UtilizadorDAO {
  
  // Procura um utilizador pelo Email (usado no Login e no Registo)
  async findByEmail(email: string) {
    return await prisma.utilizador.findFirst({
      where: { email: email },
      include: {
        tutor: true,
        funcionario: true
      }
    });
  }

  // Cria um novo Utilizador que é Tutor (usado no Registo)
  async createTutor(nome: string, email: string, passwordHash: string, nif: string, telemovel: string) {
    return await prisma.utilizador.create({
      data: {
        nome: nome,
        email: email,
        password: passwordHash,
        tutor: {
          create: {
            nif: nif,
            contacto: telemovel 
          }
        }
      }
    });
  }

  async countTotal() {
    return await prisma.funcionario.count();
  }

  // Conta funcionários por perfil
  async countByPerfil(perfil: string) {
    return await prisma.funcionario.count({
      where: { perfil: 'Staff' }
    });
  }

  // Lista todos os funcionários com seus dados
  async findAll() {
    return await prisma.funcionario.findMany({
      include: {
        utilizador: true
      }
    });
  }

  // Busca funcionário pelo ID
  async findById(idFuncionario: string) {
    return await prisma.funcionario.findUnique({
      where: { idFuncionario },
      include: {
        utilizador: true
      }
    });
  }

  // Busca todos os funcionários de um determinado perfil (usado para o Round-Robin do Staff)
  async findByPerfil(perfil: any) {
    return await prisma.funcionario.findMany({
      where: { perfil: perfil }
    });
  }
}
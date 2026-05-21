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
  // Cria um novo Utilizador que é Tutor (usado no Registo)
  async createTutor(nome: string, email: string, passwordHash: string, nif: string, telemovel: string) {
    try {
      return await prisma.utilizador.create({
        data: {
          nome,
          email,
          password: passwordHash,
          tutor: {
            create: {
              nif,
              contacto: telemovel
            }
          }
        }
      });
    } catch (error: any) {
      // O código P2002 significa "Unique constraint failed"
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          throw new Error('Este email já está registado no nosso sistema.');
        }
        if (error.meta?.target?.includes('nif')) {
          throw new Error('Este NIF já se encontra associado a outra conta.');
        }
      }
      throw error; // Se for outro erro qualquer, lança-o normalmente
    }
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
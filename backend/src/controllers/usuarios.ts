import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        rol: true
      },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: usuarios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
};

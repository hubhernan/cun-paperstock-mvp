import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAuditoria = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditoriaAcciones.findMany({
      include: {
        usuario: { select: { nombre: true, email: true } }
      },
      orderBy: { fecha: 'desc' },
      take: 100
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener auditoría' });
  }
};

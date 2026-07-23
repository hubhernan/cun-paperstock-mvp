import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllLotes = async (req: Request, res: Response) => {
  try {
    const lotes = await prisma.lote.findMany({
      include: { 
        tipoPapel: true,
        stocks: {
          include: {
            almacen: true
          }
        }
      },
      orderBy: { fechaRecepcion: 'desc' }
    });
    res.json({ success: true, data: lotes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener lotes' });
  }
};

export const createLote = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const nuevoLote = await prisma.lote.create({
      data: {
        tipoPapelId: data.tipoPapelId,
        numeroLote: data.numeroLote,
        fechaRecepcion: data.fechaRecepcion ? new Date(data.fechaRecepcion) : new Date(),
        fechaCaducidad: data.fechaCaducidad ? new Date(data.fechaCaducidad) : null,
      }
    });
    res.json({ success: true, data: nuevoLote, message: 'Lote registrado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al registrar lote' });
  }
};

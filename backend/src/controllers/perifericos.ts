import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllPerifericos = async (req: Request, res: Response) => {
  try {
    const perifericos = await prisma.periferico.findMany({
      include: {
        area: true,
        tiposCompatibles: {
          include: { tipoPapel: true }
        }
      }
    });
    res.json({ success: true, data: perifericos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener periféricos' });
  }
};

export const createPeriferico = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const nuevoPeriferico = await prisma.periferico.create({
      data: {
        identificadorUnico: data.identificadorUnico,
        marca: data.marca,
        modelo: data.modelo,
        areaId: data.areaId,
        estadoOperativo: data.estadoOperativo || 'ACTIVO',
      }
    });

    // Vincular tipos de papel compatibles si se proporcionan
    if (data.tiposPapelCompatibles && data.tiposPapelCompatibles.length > 0) {
      const vinculaciones = data.tiposPapelCompatibles.map((tipoId: string) => ({
        perifericoId: nuevoPeriferico.id,
        tipoPapelId: tipoId
      }));
      await prisma.perifericoTipoPapel.createMany({
        data: vinculaciones
      });
    }

    res.json({ success: true, data: nuevoPeriferico, message: 'Periférico creado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear periférico' });
  }
};

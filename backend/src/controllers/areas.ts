import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllAreas = async (req: Request, res: Response) => {
  try {
    const areas = await prisma.areaAeropuerto.findMany({
      include: {
        perifericos: true,
      }
    });
    res.json({ success: true, data: areas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener áreas' });
  }
};

export const createArea = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const nuevaArea = await prisma.areaAeropuerto.create({
      data: {
        nombre: data.nombre,
        terminal: data.terminal,
        zona: data.zona,
      }
    });
    res.json({ success: true, data: nuevaArea, message: 'Área creada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear área' });
  }
};

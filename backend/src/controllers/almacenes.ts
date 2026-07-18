import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllAlmacenes = async (req: Request, res: Response) => {
  try {
    const almacenes = await prisma.almacen.findMany();
    res.json({ success: true, data: almacenes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener almacenes' });
  }
};

export const createAlmacen = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const nuevoAlmacen = await prisma.almacen.create({
      data: {
        nombre: data.nombre,
        ubicacion: data.ubicacion,
        capacidad: data.capacidad,
        responsableId: data.responsableId
      }
    });
    res.json({ success: true, data: nuevoAlmacen, message: 'Almacén creado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear almacén' });
  }
};

export const getStockAlmacen = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const stock = await prisma.stockAlmacen.findMany({
      where: { almacenId: id },
      include: {
        tipoPapel: true
      }
    });
    res.json({ success: true, data: stock });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener stock del almacén' });
  }
};

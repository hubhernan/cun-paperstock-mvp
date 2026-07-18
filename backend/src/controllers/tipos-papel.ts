import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllTiposPapel = async (req: Request, res: Response) => {
  try {
    const tipos = await prisma.tipoPapel.findMany();
    res.json({ success: true, data: tipos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener tipos de papel' });
  }
};

export const createTipoPapel = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const nuevoTipo = await prisma.tipoPapel.create({
      data: {
        codigo: data.codigo,
        descripcion: data.descripcion,
        dimensiones: data.dimensiones,
        gramaje: data.gramaje,
        material: data.material,
        proveedor: data.proveedor,
        unidadMedida: data.unidadMedida,
        costoUnitario: data.costoUnitario,
        stockMinimo: data.stockMinimo,
        stockMaximo: data.stockMaximo,
        puntoReorden: data.puntoReorden,
      }
    });
    res.json({ success: true, data: nuevoTipo, message: 'Tipo de papel creado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear tipo de papel' });
  }
};

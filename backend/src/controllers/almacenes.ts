import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllAlmacenes = async (req: Request, res: Response) => {
  try {
    const almacenes = await prisma.almacen.findMany({
      include: {
        stocks: {
          include: { tipoPapel: true }
        }
      }
    });

    // Añadir inteligencia (KPIs predictivos)
    const almacenesConInteligencia = almacenes.map(almacen => {
      // Sumar stock por código
      const stockATB = almacen.stocks
        .filter(s => s.tipoPapel.codigo.includes('ATB'))
        .reduce((sum, s) => sum + s.cantidadActual, 0);
        
      const stockBTP = almacen.stocks
        .filter(s => s.tipoPapel.codigo.includes('BTP'))
        .reduce((sum, s) => sum + s.cantidadActual, 0);

      // Calcular consumo semanal simulado o fijo por ahora (Fase 2 MVP)
      const consumoPromedioATB = 25; // Rollos por semana (Ficticio para MVP)
      const consumoPromedioBTP = 150; 

      const diasCoberturaATB = consumoPromedioATB > 0 ? Math.floor((stockATB / consumoPromedioATB) * 7) : 99;
      const diasCoberturaBTP = consumoPromedioBTP > 0 ? Math.floor((stockBTP / consumoPromedioBTP) * 7) : 99;

      // Estado Visual BTP (T3 y T4 mínimo)
      let estadoVisual = 'VERDE';
      if (stockBTP < 20) estadoVisual = 'ROJO';
      else if (stockBTP < 60) estadoVisual = 'AMBAR';

      // Sugerencia
      let sugerencia = null;
      if (estadoVisual === 'ROJO' && (almacen.nombre.includes('T3') || almacen.nombre.includes('Terminal 3'))) {
        sugerencia = `Transferir 60 BTP desde T2 (Almacén Principal) hacia Terminal 3`;
      } else if (estadoVisual === 'ROJO' && (almacen.nombre.includes('T4') || almacen.nombre.includes('Terminal 4'))) {
        sugerencia = `Transferir 30 BTP desde T2 hacia Terminal 4`;
      }

      return {
        ...almacen,
        stockATB,
        stockBTP,
        estadoVisual,
        diasCobertura: Math.min(diasCoberturaATB, diasCoberturaBTP), // El más crítico
        sugerencia
      };
    });

    res.json({ success: true, data: almacenesConInteligencia });
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

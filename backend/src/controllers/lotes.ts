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
        },
        movimientos: {
          where: { tipoMovimiento: 'ENTRADA' },
          select: { cantidad: true }
        }
      },
      orderBy: { fechaRecepcion: 'desc' }
    });

    const data = lotes.map(l => {
      const cantidadInicial = l.movimientos.reduce((sum, m) => sum + m.cantidad, 0);
      const { movimientos, ...rest } = l;
      return { ...rest, cantidadInicial };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener lotes' });
  }
};

export const createLote = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    const nuevoLote = await prisma.$transaction(async (tx) => {
      const lote = await tx.lote.create({
        data: {
          tipoPapelId: data.tipoPapelId,
          numeroLote: data.numeroLote,
          fechaRecepcion: data.fechaRecepcion ? new Date(data.fechaRecepcion) : new Date(),
          fechaCaducidad: data.fechaCaducidad ? new Date(data.fechaCaducidad) : null,
        }
      });

      if (data.almacenId && data.cantidad && data.usuarioId) {
        await tx.stockAlmacen.create({
          data: {
            almacenId: data.almacenId,
            tipoPapelId: data.tipoPapelId,
            loteId: lote.id,
            cantidadActual: Number(data.cantidad)
          }
        });
        
        await tx.movimientoInventario.create({
          data: {
            tipoPapelId: data.tipoPapelId,
            loteId: lote.id,
            almacenDestinoId: data.almacenId,
            tipoMovimiento: 'ENTRADA',
            cantidad: Number(data.cantidad),
            usuarioId: data.usuarioId,
            comentarios: 'Registro inicial de lote'
          }
        });
      }
      return lote;
    });

    res.json({ success: true, data: nuevoLote, message: 'Lote registrado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al registrar lote' });
  }
};

export const getHistorialLote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movimientos = await prisma.movimientoInventario.findMany({
      where: { loteId: id },
      include: { almacenOrigen: true, almacenDestino: true, usuario: true },
      orderBy: { fechaMovimiento: 'desc' }
    });
    
    const asignaciones = await prisma.asignacionPeriferico.findMany({
      where: { loteId: id },
      include: { periferico: { include: { area: true } }, usuario: true },
      orderBy: { fechaAsignacion: 'desc' }
    });

    res.json({ success: true, data: { movimientos, asignaciones } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener historial del lote' });
  }
};

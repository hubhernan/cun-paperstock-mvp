import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../socket';

const prisma = new PrismaClient();

export const getMovimientos = async (req: Request, res: Response) => {
  try {
    const movimientos = await prisma.movimientoInventario.findMany({
      include: {
        tipoPapel: true,
        almacenOrigen: true,
        almacenDestino: true,
        usuario: { select: { nombre: true, email: true } }
      },
      orderBy: { fechaMovimiento: 'desc' },
      take: 50 // Limitando a los últimos 50 para el dashboard/historial
    });
    res.json({ success: true, data: movimientos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener movimientos' });
  }
};

export const registrarMovimiento = async (req: Request, res: Response) => {
  const { tipoPapelId, loteId, almacenOrigenId, almacenDestinoId, tipoMovimiento, cantidad, comentarios } = req.body;
  const usuarioId = (req as any).user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el registro del movimiento
      const movimiento = await tx.movimientoInventario.create({
        data: {
          tipoPapelId,
          loteId,
          almacenOrigenId,
          almacenDestinoId,
          tipoMovimiento,
          cantidad: Number(cantidad),
          usuarioId,
          comentarios
        }
      });

      // 2. Actualizar stock basado en el tipo de movimiento
      if (tipoMovimiento === 'ENTRADA') {
        if (!almacenDestinoId) throw new Error('ENTRADA requiere almacenDestinoId');
        await updateStock(tx, almacenDestinoId, tipoPapelId, Number(cantidad));
      } 
      else if (tipoMovimiento === 'SALIDA' || tipoMovimiento === 'MERMA') {
        if (!almacenOrigenId) throw new Error(`${tipoMovimiento} requiere almacenOrigenId`);
        await updateStock(tx, almacenOrigenId, tipoPapelId, -Number(cantidad));
      } 
      else if (tipoMovimiento === 'TRANSFERENCIA') {
        if (!almacenOrigenId || !almacenDestinoId) throw new Error('TRANSFERENCIA requiere origen y destino');
        await updateStock(tx, almacenOrigenId, tipoPapelId, -Number(cantidad));
        await updateStock(tx, almacenDestinoId, tipoPapelId, Number(cantidad));
      }

      return movimiento;
    });

    res.json({ success: true, data: result, message: 'Movimiento registrado exitosamente' });
    
    // Emitir evento WebSocket para actualizar en tiempo real
    try {
      const io = getIO();
      io.emit('stockUpdate', { action: 'MOVIMIENTO', tipoMovimiento, data: result });
    } catch (err) {
      console.error('WebSocket no disponible', err);
    }
  } catch (error: any) {
    console.error('Error en transacción:', error);
    res.status(400).json({ success: false, message: error.message || 'Error al registrar movimiento' });
  }
};

// Función auxiliar para actualizar o crear registro de stock
async function updateStock(tx: any, almacenId: string, tipoPapelId: string, delta: number) {
  const stockRecord = await tx.stockAlmacen.findUnique({
    where: {
      almacenId_tipoPapelId: { almacenId, tipoPapelId }
    }
  });

  if (stockRecord) {
    if (stockRecord.cantidadActual + delta < 0) {
      throw new Error(`Stock insuficiente en el almacén para el tipo de papel`);
    }
    await tx.stockAlmacen.update({
      where: { id: stockRecord.id },
      data: { cantidadActual: stockRecord.cantidadActual + delta }
    });
  } else {
    if (delta < 0) {
      throw new Error(`Stock insuficiente (no existe registro en almacén)`);
    }
    await tx.stockAlmacen.create({
      data: {
        almacenId,
        tipoPapelId,
        cantidadActual: delta
      }
    });
  }
}

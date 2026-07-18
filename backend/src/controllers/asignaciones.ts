import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../socket';

const prisma = new PrismaClient();

export const getAsignaciones = async (req: Request, res: Response) => {
  try {
    const asignaciones = await prisma.asignacionPeriferico.findMany({
      include: {
        periferico: { include: { area: true } },
        tipoPapel: true,
        usuario: { select: { nombre: true } }
      },
      orderBy: { fechaAsignacion: 'desc' },
      take: 50
    });
    res.json({ success: true, data: asignaciones });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener asignaciones' });
  }
};

export const registrarAsignacion = async (req: Request, res: Response) => {
  const { perifericoId, tipoPapelId, loteId, cantidadAsignada, almacenOrigenId } = req.body;
  const usuarioId = (req as any).user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Descontar del almacén de origen
      const stockRecord = await tx.stockAlmacen.findUnique({
        where: { almacenId_tipoPapelId: { almacenId: almacenOrigenId, tipoPapelId } }
      });

      if (!stockRecord || stockRecord.cantidadActual < cantidadAsignada) {
        throw new Error('Stock insuficiente en el almacén de origen');
      }

      await tx.stockAlmacen.update({
        where: { id: stockRecord.id },
        data: { cantidadActual: stockRecord.cantidadActual - Number(cantidadAsignada) }
      });

      // 2. Registrar el movimiento como SALIDA por asignación
      await tx.movimientoInventario.create({
        data: {
          tipoPapelId,
          loteId,
          almacenOrigenId,
          tipoMovimiento: 'SALIDA',
          cantidad: Number(cantidadAsignada),
          usuarioId,
          comentarios: `Asignación a periférico ${perifericoId}`
        }
      });

      // 3. Crear el registro de asignación
      const asignacion = await tx.asignacionPeriferico.create({
        data: {
          perifericoId,
          tipoPapelId,
          loteId,
          cantidadAsignada: Number(cantidadAsignada),
          usuarioId
        }
      });

      return asignacion;
    });

    res.json({ success: true, data: result, message: 'Asignación registrada exitosamente' });
    
    // Emitir evento WebSocket para actualizar en tiempo real
    try {
      const io = getIO();
      io.emit('stockUpdate', { action: 'ASIGNACION', data: result });
    } catch (err) {
      console.error('WebSocket no disponible', err);
    }
  } catch (error: any) {
    console.error('Error en asignación:', error);
    res.status(400).json({ success: false, message: error.message || 'Error al registrar asignación' });
  }
};

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../socket';
import { verificarAlertaStock } from './alertas';
import { deductStockFIFO } from './movimientos';

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
    const results = await prisma.$transaction(async (tx) => {
      // 1. Descontar del almacén de origen usando FIFO (o lote específico si se proveyó)
      const lotesDeducidos = await deductStockFIFO(tx, almacenOrigenId, tipoPapelId, Number(cantidadAsignada), loteId);

      let asignacionesGeneradas = [];

      for (const deduccion of lotesDeducidos) {
        // 2. Registrar el movimiento como SALIDA por asignación
        await tx.movimientoInventario.create({
          data: {
            tipoPapelId,
            loteId: deduccion.loteId,
            almacenOrigenId,
            tipoMovimiento: 'SALIDA',
            cantidad: deduccion.cantidad,
            usuarioId,
            comentarios: `Asignación a periférico ${perifericoId}`
          }
        });

        // 3. Crear el registro de asignación
        const asignacion = await tx.asignacionPeriferico.create({
          data: {
            perifericoId,
            tipoPapelId,
            loteId: deduccion.loteId,
            cantidadAsignada: deduccion.cantidad,
            usuarioId
          }
        });
        
        asignacionesGeneradas.push(asignacion);
      }

      // 4. Verificar alerta de stock
      await verificarAlertaStock(tx, tipoPapelId);

      return asignacionesGeneradas;
    });

    res.json({ success: true, data: results, message: 'Asignación(es) registrada(s) exitosamente' });
    
    // Emitir evento WebSocket para actualizar en tiempo real
    try {
      const io = getIO();
      io.emit('stockUpdate', { action: 'ASIGNACION', data: results });
    } catch (err) {
      console.error('WebSocket no disponible', err);
    }
  } catch (error: any) {
    console.error('Error en asignación:', error);
    res.status(400).json({ success: false, message: error.message || 'Error al registrar asignación' });
  }
};

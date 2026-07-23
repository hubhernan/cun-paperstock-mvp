import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../socket';
import { verificarAlertaStock } from './alertas';

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
    const results = await prisma.$transaction(async (tx) => {
      let movimientosGenerados: any[] = [];

      // 1. Manejar Entrada (Requiere loteId o asume un lote "legado")
      if (tipoMovimiento === 'ENTRADA') {
        if (!almacenDestinoId) throw new Error('ENTRADA requiere almacenDestinoId');
        
        await updateStockLote(tx, almacenDestinoId, tipoPapelId, Number(cantidad), loteId);
        
        const mov = await tx.movimientoInventario.create({
          data: {
            tipoPapelId, loteId, almacenDestinoId, tipoMovimiento,
            cantidad: Number(cantidad), usuarioId, comentarios
          }
        });
        movimientosGenerados.push(mov);
      } 
      
      // 2. Manejar Salida, Merma o Transferencia (FIFO Automático si no hay lote)
      else {
        if (!almacenOrigenId) throw new Error(`${tipoMovimiento} requiere almacenOrigenId`);
        if (tipoMovimiento === 'TRANSFERENCIA' && !almacenDestinoId) throw new Error('TRANSFERENCIA requiere origen y destino');

        // Deducción FIFO
        const lotesDeducidos = await deductStockFIFO(tx, almacenOrigenId, tipoPapelId, Number(cantidad), loteId);

        // Generar movimientos y (si es transferencia) añadir al destino
        for (const deduccion of lotesDeducidos) {
          if (tipoMovimiento === 'TRANSFERENCIA' && almacenDestinoId) {
            await updateStockLote(tx, almacenDestinoId, tipoPapelId, deduccion.cantidad, deduccion.loteId);
          }

          const mov = await tx.movimientoInventario.create({
            data: {
              tipoPapelId,
              loteId: deduccion.loteId,
              almacenOrigenId,
              almacenDestinoId: tipoMovimiento === 'TRANSFERENCIA' ? almacenDestinoId : null,
              tipoMovimiento,
              cantidad: deduccion.cantidad,
              usuarioId,
              comentarios
            }
          });
          movimientosGenerados.push(mov);
        }
      }

      // 3. Verificar si el nivel de stock bajó del mínimo para generar alerta
      if (tipoMovimiento === 'SALIDA' || tipoMovimiento === 'MERMA' || tipoMovimiento === 'TRANSFERENCIA') {
        await verificarAlertaStock(tx, tipoPapelId);
      }

      return movimientosGenerados;
    });

    res.json({ success: true, data: results, message: 'Movimiento(s) registrado(s) exitosamente' });
    
    // Emitir evento WebSocket para actualizar en tiempo real
    try {
      const io = getIO();
      // Emitimos el primer movimiento como representante o todos
      io.emit('stockUpdate', { action: 'MOVIMIENTO', tipoMovimiento, data: results[0] });
    } catch (err) {
      console.error('WebSocket no disponible', err);
    }
  } catch (error: any) {
    console.error('Error en transacción:', error);
    res.status(400).json({ success: false, message: error.message || 'Error al registrar movimiento' });
  }
};

// Función para agregar stock a un lote específico
export async function updateStockLote(tx: any, almacenId: string, tipoPapelId: string, cantidad: number, loteId?: string | null) {
  const stockRecord = await tx.stockAlmacen.findFirst({
    where: { almacenId, tipoPapelId, loteId: loteId || null }
  });

  if (stockRecord) {
    await tx.stockAlmacen.update({
      where: { id: stockRecord.id },
      data: { cantidadActual: stockRecord.cantidadActual + cantidad }
    });
  } else {
    await tx.stockAlmacen.create({
      data: { almacenId, tipoPapelId, loteId: loteId || null, cantidadActual: cantidad }
    });
  }
}

// Función para deducir stock aplicando FIFO (First-In, First-Out)
export async function deductStockFIFO(tx: any, almacenId: string, tipoPapelId: string, cantidadRequerida: number, loteEspecifico?: string | null) {
  let cantidadRestante = cantidadRequerida;
  const deducciones: { loteId: string | null, cantidad: number }[] = [];

  // Buscar stocks disponibles ordenados por Lote (caducidad o fecha de recepción)
  const stocksDisponibles = await tx.stockAlmacen.findMany({
    where: { 
      almacenId, 
      tipoPapelId, 
      cantidadActual: { gt: 0 },
      ...(loteEspecifico ? { loteId: loteEspecifico } : {})
    },
    include: { lote: true }
  });

  // Ordenar en memoria (FIFO) porque Prisma no soporta order by anidado fácilmente con nulls si no es estricto
  stocksDisponibles.sort((a: any, b: any) => {
    // Si no hay lote, se considera viejo (prioridad)
    if (!a.lote) return -1;
    if (!b.lote) return 1;
    
    // Prioridad por caducidad
    if (a.lote.fechaCaducidad && b.lote.fechaCaducidad) {
      return new Date(a.lote.fechaCaducidad).getTime() - new Date(b.lote.fechaCaducidad).getTime();
    }
    // Si uno no tiene caducidad, el que tiene caducidad va primero
    if (a.lote.fechaCaducidad && !b.lote.fechaCaducidad) return -1;
    if (!a.lote.fechaCaducidad && b.lote.fechaCaducidad) return 1;

    // Si ninguno tiene caducidad, usar fechaRecepcion
    return new Date(a.lote.fechaRecepcion).getTime() - new Date(b.lote.fechaRecepcion).getTime();
  });

  let totalDisponible = 0;
  for (const st of stocksDisponibles) {
    totalDisponible += st.cantidadActual;
  }

  if (totalDisponible < cantidadRequerida) {
    throw new Error(`Stock insuficiente. Solicitado: ${cantidadRequerida}, Disponible: ${totalDisponible}`);
  }

  for (const stock of stocksDisponibles) {
    if (cantidadRestante <= 0) break;

    const deducible = Math.min(stock.cantidadActual, cantidadRestante);
    
    await tx.stockAlmacen.update({
      where: { id: stock.id },
      data: { cantidadActual: stock.cantidadActual - deducible }
    });

    deducciones.push({ loteId: stock.loteId, cantidad: deducible });
    cantidadRestante -= deducible;
  }

  return deducciones;
}

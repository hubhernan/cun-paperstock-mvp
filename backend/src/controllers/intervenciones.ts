import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { clearKioskoAlertState } from '../services/AlertService';

const prisma = new PrismaClient();

export const createIntervencion = async (req: Request, res: Response) => {
  try {
    const { perifericoId, accion, almacenOrigenId, comentarios } = req.body;
    const ingenieroId = (req as any).user.id;

    // Ejecutar todo el proceso en una transacción para garantizar integridad referencial y de inventarios
    const result = await prisma.$transaction(async (tx) => {
      // 1. Guardar la intervención
      const intervencion = await tx.intervencionKiosko.create({
        data: {
          perifericoId,
          ingenieroId,
          accion,
          almacenOrigenId: almacenOrigenId || null,
          comentarios
        },
        include: {
          ingeniero: true,
          periferico: true
        }
      });

      // 2. Determinar si se consume papel e impacta inventario
      let papelATBConsumido = false;
      let papelBTPConsumido = false;

      const dataToUpdate: any = {};
      if (accion === 'Cambio de Papel ATB') {
        dataToUpdate.nivelAtb = 100;
        dataToUpdate.estadoConexion = 'ONLINE';
        papelATBConsumido = true;
      } else if (accion === 'Cambio de Papel BTP') {
        dataToUpdate.nivelBtp = 100;
        dataToUpdate.estadoConexion = 'ONLINE';
        papelBTPConsumido = true;
      } else if (accion.includes('Reset Físico')) {
        dataToUpdate.nivelAtb = 100;
        dataToUpdate.nivelBtp = 100;
        dataToUpdate.estadoConexion = 'ONLINE';
      } else if (accion === 'Inspección de Rutina (Lectura de Niveles)') {
        const { nivelAtb, nivelBtp, estadoConexion } = req.body;
        if (nivelAtb !== undefined) dataToUpdate.nivelAtb = Number(nivelAtb);
        if (nivelBtp !== undefined) dataToUpdate.nivelBtp = Number(nivelBtp);
        if (estadoConexion !== undefined) dataToUpdate.estadoConexion = estadoConexion;
      }

      // Actualizar el kiosko (periférico)
      if (Object.keys(dataToUpdate).length > 0) {
        await tx.periferico.update({
          where: { id: perifericoId },
          data: dataToUpdate
        });
      }

      // 3. Procesar salida de inventario (FIFO) si hubo cambio de papel
      if (papelATBConsumido || papelBTPConsumido) {
        if (!almacenOrigenId) {
          throw new Error('Almacén de origen requerido para realizar cambio de papel.');
        }

        const tipoPapelCodigo = papelATBConsumido ? 'ATB' : 'BTP';
        const tipoPapelObj = await tx.tipoPapel.findFirst({
          where: {
            codigo: {
              contains: tipoPapelCodigo,
              mode: 'insensitive'
            }
          }
        });

        if (!tipoPapelObj) {
          throw new Error(`Tipo de papel ${tipoPapelCodigo} no configurado en el catálogo.`);
        }

        // Buscar stock disponible en el almacén de origen
        let stockElegido = await tx.stockAlmacen.findFirst({
          where: {
            almacenId: almacenOrigenId,
            tipoPapelId: tipoPapelObj.id,
            cantidadActual: { gt: 0 }
          }
        });

        if (!stockElegido) {
          stockElegido = await tx.stockAlmacen.findFirst({
            where: {
              almacenId: almacenOrigenId,
              tipoPapelId: tipoPapelObj.id
            }
          });
        }

        if (!stockElegido) {
          stockElegido = await tx.stockAlmacen.create({
            data: {
              almacenId: almacenOrigenId,
              tipoPapelId: tipoPapelObj.id,
              cantidadActual: 0
            }
          });
        }

        // Decrementar el stock en 1 rollo
        const nuevaCantidad = Math.max(0, stockElegido.cantidadActual - 1);
        await tx.stockAlmacen.update({
          where: { id: stockElegido.id },
          data: {
            cantidadActual: nuevaCantidad
          }
        });

        // Registrar movimiento
        await tx.movimientoInventario.create({
          data: {
            tipoPapelId: tipoPapelObj.id,
            loteId: stockElegido.loteId,
            almacenOrigenId: almacenOrigenId,
            almacenDestinoId: null,
            tipoMovimiento: 'SALIDA',
            cantidad: 1,
            usuarioId: ingenieroId,
            comentarios: `Cambio manual en Kiosko ${intervencion.periferico.identificadorUnico}`
          }
        });

        // Registrar asignación a periférico para historial de consumos
        await tx.asignacionPeriferico.create({
          data: {
            perifericoId: perifericoId,
            tipoPapelId: tipoPapelObj.id,
            loteId: stockElegido.loteId || null,
            cantidadAsignada: 1,
            usuarioId: ingenieroId
          }
        });
      }

      // 4. Marcar automáticamente alertas pendientes de este kiosko como leídas / resueltas
      const updatedKiosko = await tx.periferico.findUnique({ where: { id: perifericoId } });
      const idKioskoCodigo = intervencion.periferico.identificadorUnico;

      if (accion === 'Cambio de Papel ATB') {
        await tx.alertaStock.updateMany({
          where: {
            leida: false,
            mensaje: { contains: idKioskoCodigo },
            AND: { mensaje: { contains: 'ATB' } }
          },
          data: { leida: true }
        });
      } else if (accion === 'Cambio de Papel BTP') {
        await tx.alertaStock.updateMany({
          where: {
            leida: false,
            mensaje: { contains: idKioskoCodigo },
            AND: { mensaje: { contains: 'BTP' } }
          },
          data: { leida: true }
        });
      }

      // Si ambos insumos del kiosko están sanos (> 20%), resolver cualquier otra alerta del kiosko
      if (updatedKiosko && updatedKiosko.nivelAtb > 20 && updatedKiosko.nivelBtp > 20) {
        await tx.alertaStock.updateMany({
          where: {
            leida: false,
            mensaje: { contains: idKioskoCodigo }
          },
          data: { leida: true }
        });
      }

      // 5. Registrar auditoría de seguridad y acciones
      await tx.auditoriaAcciones.create({
        data: {
          usuarioId: ingenieroId,
          accion: 'REGISTRO_INTERVENCION',
          entidad: 'IntervencionKiosko',
          entidadId: intervencion.id,
          detalles: `${accion} en Kiosko ${intervencion.periferico.identificadorUnico} (Ingeniero: ${intervencion.ingeniero.nombre})`
        }
      });

      return intervencion;
    });

    clearKioskoAlertState(perifericoId);

    res.json({ success: true, data: result, message: 'Acción registrada con éxito y stock actualizado.' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Error al registrar la acción' });
  }
};

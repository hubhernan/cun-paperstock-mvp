import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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

        // Buscar stock disponible en el almacén de origen (FIFO por fecha de recepción del lote)
        const stocksValidos = await tx.stockAlmacen.findMany({
          where: {
            almacenId: almacenOrigenId,
            tipoPapelId: tipoPapelObj.id,
            cantidadActual: { gt: 0 }
          },
          include: {
            lote: true
          },
          orderBy: {
            lote: {
              fechaRecepcion: 'asc'
            }
          }
        });

        // Si no hay stock disponible, arrojamos un error semántico.
        if (stocksValidos.length === 0 || !stocksValidos[0]) {
          throw new Error(`No hay stock disponible del insumo ${tipoPapelObj.codigo} en el almacén seleccionado para descontar.`);
        }

        const stockElegido = stocksValidos[0];

        // Decrementar stock
        await tx.stockAlmacen.update({
          where: { id: stockElegido.id },
          data: {
            cantidadActual: {
              decrement: 1
            }
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
            loteId: stockElegido.loteId,
            cantidadAsignada: 1,
            usuarioId: ingenieroId,
            comentarios: `Refill manual en Kiosko ${intervencion.periferico.identificadorUnico}`
          }
        });
      }

      // 4. Registrar auditoría de seguridad y acciones
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

    res.json({ success: true, data: result, message: 'Acción registrada con éxito y stock actualizado.' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Error al registrar la acción' });
  }
};

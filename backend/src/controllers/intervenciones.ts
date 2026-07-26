import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../socket';

const prisma = new PrismaClient();

export const createIntervencion = async (req: Request, res: Response) => {
  try {
    const { perifericoId, accion, almacenOrigenId, comentarios } = req.body;
    const ingenieroId = (req as any).user.id;

    // 1. Guardar la intervención
    const intervencion = await prisma.intervencionKiosko.create({
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

    // 2. Si la acción es "Cambio de Papel" o "Reset Físico", resetear los niveles correspondientes
    if (accion.includes('Cambio de Papel') || accion.includes('Reset Físico')) {
      const dataToUpdate: any = { estadoConexion: 'ONLINE' }; // Asumimos que lo dejaron en línea

      if (accion === 'Cambio de Papel ATB') {
        dataToUpdate.nivelAtb = 100;
      } else if (accion === 'Cambio de Papel BTP') {
        dataToUpdate.nivelBtp = 100;
      } else if (accion.includes('Reset Físico')) {
        dataToUpdate.nivelAtb = 100;
        dataToUpdate.nivelBtp = 100;
      }

      const updatedKiosk = await prisma.periferico.update({
        where: { id: perifericoId },
        data: dataToUpdate
      });

      // Notificar a los clientes conectados (Dashboard, etc.)
      try {
        const io = getIO();
        io.emit('kiosk_telemetry_update', {
          perifericoId: updatedKiosk.id,
          estadoConexion: updatedKiosk.estadoConexion,
          nivelAtb: updatedKiosk.nivelAtb,
          nivelBtp: updatedKiosk.nivelBtp,
          ultimoConsumo: updatedKiosk.ultimoConsumo,
          impresionesDiarias: updatedKiosk.impresionesDiarias
        });
      } catch (err) {
        console.error('Socket.io no inicializado', err);
      }
    }

    // 3. Registrar auditoría
    await prisma.auditoriaAcciones.create({
      data: {
        usuarioId: ingenieroId,
        accion: 'REGISTRO_INTERVENCION',
        entidad: 'IntervencionKiosko',
        entidadId: intervencion.id,
        detalles: `${accion} en Kiosko ${intervencion.periferico.identificadorUnico}`
      }
    });

    res.json({ success: true, data: intervencion, message: 'Acción registrada con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al registrar la acción' });
  }
};

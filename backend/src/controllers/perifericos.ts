import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sincronizarAlertasConPerifericos } from '../services/AlertService';

const prisma = new PrismaClient();

export const getAllPerifericos = async (req: Request, res: Response) => {
  try {
    const perifericos = await prisma.periferico.findMany({
      include: {
        area: true,
        tiposCompatibles: {
          include: { tipoPapel: true }
        }
      }
    });
    res.json({ success: true, data: perifericos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener periféricos' });
  }
};

export const createPeriferico = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const nuevoPeriferico = await prisma.periferico.create({
      data: {
        identificadorUnico: data.identificadorUnico,
        marca: data.marca,
        modelo: data.modelo,
        areaId: data.areaId,
        estadoOperativo: data.estadoOperativo || 'ACTIVO',
      }
    });

    // Vincular tipos de papel compatibles si se proporcionan
    if (data.tiposPapelCompatibles && data.tiposPapelCompatibles.length > 0) {
      const vinculaciones = data.tiposPapelCompatibles.map((tipoId: string) => ({
        perifericoId: nuevoPeriferico.id,
        tipoPapelId: tipoId
      }));
      await prisma.perifericoTipoPapel.createMany({
        data: vinculaciones
      });
    }

    res.json({ success: true, data: nuevoPeriferico, message: 'Periférico creado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear periférico' });
  }
};

export const updateNivelPeriferico = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { nivelAtb, nivelBtp } = req.body;
  const usuarioId = (req as any).user.id;

  try {
    const dataToUpdate: any = {};
    if (nivelAtb !== undefined) dataToUpdate.nivelAtb = Number(nivelAtb);
    if (nivelBtp !== undefined) dataToUpdate.nivelBtp = Number(nivelBtp);

    const perifericoActualizado = await prisma.periferico.update({
      where: { id },
      data: dataToUpdate
    });

    await sincronizarAlertasConPerifericos(prisma);

    await prisma.auditoriaAcciones.create({
      data: {
        usuarioId,
        accion: 'ACTUALIZACION_SEMAFORO',
        entidad: 'Periferico',
        entidadId: id,
        detalles: `Semáforo actualizado en ${perifericoActualizado.identificadorUnico}: ATB ${perifericoActualizado.nivelAtb}%, BTP ${perifericoActualizado.nivelBtp}%`
      }
    });

    res.json({ success: true, data: perifericoActualizado, message: 'Semáforo actualizado.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar semáforo de periférico' });
  }
};

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllIncidentes = async (req: Request, res: Response) => {
  try {
    const { estado } = req.query;
    const filter: any = {};
    if (estado) {
      filter.estado = estado;
    }

    const incidentes = await prisma.incidenteDiscrepancia.findMany({
      where: filter,
      include: {
        ingeniero: true
      },
      orderBy: {
        fechaIncidente: 'desc'
      }
    });

    res.json({ success: true, data: incidentes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener incidentes' });
  }
};

export const createIncidente = async (req: Request, res: Response) => {
  try {
    const { terminal, stockCalculado, stockFisico, comentarios } = req.body;
    const ingenieroId = (req as any).user.id;

    const diferencia = stockFisico - stockCalculado;

    const nuevoIncidente = await prisma.incidenteDiscrepancia.create({
      data: {
        terminal,
        ingenieroId,
        stockCalculado,
        stockFisico,
        diferencia,
        comentarios,
        estado: 'ABIERTO'
      },
      include: {
        ingeniero: true
      }
    });

    // Auditoría
    await prisma.auditoriaAcciones.create({
      data: {
        usuarioId: ingenieroId,
        accion: 'REPORTE_DISCREPANCIA',
        entidad: 'IncidenteDiscrepancia',
        entidadId: nuevoIncidente.id,
        detalles: `Diferencia de ${diferencia} tickets reportada en ${terminal}`
      }
    });

    res.json({ success: true, data: nuevoIncidente, message: 'Incidente reportado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al reportar incidente' });
  }
};

export const updateIncidenteStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado, comentarios } = req.body;
    const usuarioId = (req as any).user.id;

    const incidenteExistente = await prisma.incidenteDiscrepancia.findUnique({
      where: { id: id as string },
    });

    if (!incidenteExistente) {
      return res.status(404).json({ success: false, message: 'Incidente no encontrado' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { nombre: true }
    });

    let comentariosActualizados = incidenteExistente.comentarios || '';

    if (comentarios && comentarios.trim()) {
      const nowFormatted = new Date().toLocaleString('es-MX', { timeZone: 'America/Cancun' });
      const nuevaNota = `\n[${nowFormatted} - ${usuario?.nombre || 'Usuario'} (${estado})]: ${comentarios.trim()}`;
      comentariosActualizados = comentariosActualizados ? comentariosActualizados + nuevaNota : nuevaNota.trim();
    }

    const dataToUpdate: any = {};
    if (estado) dataToUpdate.estado = estado;
    if (comentarios && comentarios.trim()) dataToUpdate.comentarios = comentariosActualizados;

    const incidenteActualizado = await prisma.incidenteDiscrepancia.update({
      where: { id: id as string },
      data: dataToUpdate,
      include: { ingeniero: true }
    });

    // Auditoría
    await prisma.auditoriaAcciones.create({
      data: {
        usuarioId: usuarioId,
        accion: 'CAMBIO_ESTADO_INCIDENTE',
        entidad: 'IncidenteDiscrepancia',
        entidadId: incidenteActualizado.id,
        detalles: `Estado cambiado a ${estado}. ${comentarios ? `Nota: ${comentarios}` : ''}`
      }
    });

    res.json({ success: true, data: incidenteActualizado, message: 'Estado e historial de incidente actualizados' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar el estado del incidente' });
  }
};

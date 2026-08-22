import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAuditoria = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin, usuarioId, accion, entidad, busqueda, limit } = req.query;

    const where: any = {};

    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) {
        const parts = String(fechaInicio).split('-').map(Number);
        if (parts.length === 3) {
          where.fecha.gte = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
        } else {
          where.fecha.gte = new Date(String(fechaInicio));
        }
      }
      if (fechaFin) {
        const parts = String(fechaFin).split('-').map(Number);
        if (parts.length === 3) {
          where.fecha.lte = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
        } else {
          const d = new Date(String(fechaFin));
          d.setHours(23, 59, 59, 999);
          where.fecha.lte = d;
        }
      }
    }

    if (usuarioId) where.usuarioId = String(usuarioId);
    if (accion) where.accion = String(accion);
    if (entidad) where.entidad = String(entidad);

    if (busqueda) {
      const queryStr = String(busqueda).trim();
      where.OR = [
        { detalles: { contains: queryStr } },
        { accion: { contains: queryStr } },
        { entidad: { contains: queryStr } },
        { usuario: { nombre: { contains: queryStr } } },
        { usuario: { email: { contains: queryStr } } }
      ];
    }

    const takeLimit = limit ? Number(limit) : 500;

    const logs = await prisma.auditoriaAcciones.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombre: true, email: true } }
      },
      orderBy: { fecha: 'desc' },
      take: takeLimit
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error en getAuditoria:', error);
    res.status(500).json({ success: false, message: 'Error al obtener auditoría' });
  }
};

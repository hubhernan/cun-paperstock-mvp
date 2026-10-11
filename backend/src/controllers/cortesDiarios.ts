import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asegurarCortesDiarios, getStockActualAlmacenes } from '../services/CorteDiarioService';

const prisma = new PrismaClient();

const parseFechaInicio = (str: any): Date | undefined => {
  if (!str || str === '' || str === 'undefined' || str === 'null') return undefined;
  if (typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-').map(Number);
    const y = parts[0] ?? 2026;
    const m = parts[1] ?? 1;
    const d = parts[2] ?? 1;
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
};

const parseFechaFin = (str: any): Date | undefined => {
  if (!str || str === '' || str === 'undefined' || str === 'null') return undefined;
  if (typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-').map(Number);
    const y = parts[0] ?? 2026;
    const m = parts[1] ?? 1;
    const d = parts[2] ?? 1;
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) return undefined;
  d.setHours(23, 59, 59, 999);
  return d;
};

// Obtener los últimos 3 cortes diarios (23:50 hrs) con sumatoria real de almacenes
export const getUltimos3CortesDiarios = async (req: Request, res: Response) => {
  try {
    // Asegurar y sincronizar todos los cortes diarios hasta hoy con existencia real
    await asegurarCortesDiarios();

    const cortes = await prisma.corteDiario.findMany({
      take: 3,
      orderBy: { fechaCorte: 'desc' }
    });

    const dataFormatted = cortes.map(c => ({
      id: c.id,
      fechaCorte: c.fechaCorte,
      totalStock: c.totalAtb + c.totalBtp,
      totalAtb: c.totalAtb,
      totalBtp: c.totalBtp,
      creadoPor: c.creadoPor
    }));

    res.json({ success: true, data: dataFormatted });
  } catch (error) {
    console.error('Error al obtener últimos 3 cortes diarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener cortes diarios' });
  }
};

// Obtener histórico de cortes diarios para la sección de Reportes
export const getCortesDiariosReporte = async (req: Request, res: Response) => {
  try {
    // Asegurar y recuperar todos los cortes históricos pendientes
    await asegurarCortesDiarios();

    const { fechaInicio, fechaFin } = req.query;
    const where: any = {};

    const gte = parseFechaInicio(fechaInicio);
    const lte = parseFechaFin(fechaFin);

    if (gte || lte) {
      where.fechaCorte = {};
      if (gte) where.fechaCorte.gte = gte;
      if (lte) where.fechaCorte.lte = lte;
    }

    const cortes = await prisma.corteDiario.findMany({
      where,
      orderBy: { fechaCorte: 'desc' }
    });

    const dataFormatted = cortes.map(c => ({
      id: c.id,
      fechaCorte: c.fechaCorte,
      totalStock: c.totalAtb + c.totalBtp,
      totalAtb: c.totalAtb,
      totalBtp: c.totalBtp,
      creadoPor: c.creadoPor || 'SISTEMA'
    }));

    res.json(dataFormatted);
  } catch (error) {
    console.error('Error al consultar reporte de cortes diarios:', error);
    res.status(500).json({ success: false, message: 'Error al generar reporte de cortes diarios' });
  }
};

// Ejecutar o forzar corte diario a las 23:50 con sumatoria real de almacenes
export const ejecutarCorteDiarioManual = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id || 'SISTEMA';

    // Obtener la existencia real de todos los almacenes
    const { totalAtb, totalBtp } = await getStockActualAlmacenes();

    const fechaCorte = new Date();
    fechaCorte.setHours(23, 50, 0, 0);

    const nuevoCorte = await prisma.corteDiario.create({
      data: {
        fechaCorte,
        totalAtb,
        totalBtp,
        creadoPor: adminId
      }
    });

    res.json({ success: true, data: nuevoCorte, message: 'Corte diario generado a las 23:50 hrs exitosamente con las existencias reales de almacén' });
  } catch (error) {
    console.error('Error al generar corte diario:', error);
    res.status(500).json({ success: false, message: 'Error al generar corte diario' });
  }
};

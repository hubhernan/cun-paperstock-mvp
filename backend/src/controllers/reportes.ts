import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const parseFechaInicio = (str: any): Date | undefined => {
  if (!str || str === '' || str === 'undefined' || str === 'null') return undefined;
  if (typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
};

const parseFechaFin = (str: any): Date | undefined => {
  if (!str || str === '' || str === 'undefined' || str === 'null') return undefined;
  if (typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) return undefined;
  d.setHours(23, 59, 59, 999);
  return d;
};

const aplicarFiltroFechas = (whereObj: any, campoFecha: string, fechaInicio: any, fechaFin: any) => {
  const gte = parseFechaInicio(fechaInicio);
  const lte = parseFechaFin(fechaFin);

  if (gte || lte) {
    whereObj[campoFecha] = {};
    if (gte) whereObj[campoFecha].gte = gte;
    if (lte) whereObj[campoFecha].lte = lte;
  }
};

export const getReporteMovimientos = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin, tipoMovimiento } = req.query;

    const where: any = {};
    aplicarFiltroFechas(where, 'fechaMovimiento', fechaInicio, fechaFin);

    if (tipoMovimiento) {
      where.tipoMovimiento = tipoMovimiento;
    }

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        tipoPapel: true,
        almacenOrigen: true,
        almacenDestino: true,
        usuario: true,
        lote: true,
      },
      orderBy: { fechaMovimiento: 'desc' },
    });

    res.json(movimientos);
  } catch (error) {
    console.error('Error en getReporteMovimientos:', error);
    res.status(500).json({ error: 'Error al generar el reporte de movimientos' });
  }
};

export const getReporteStockValor = async (req: Request, res: Response) => {
  try {
    const tiposPapel = await prisma.tipoPapel.findMany({
      include: {
        stocks: {
          include: {
            almacen: true,
          }
        },
      },
      orderBy: { codigo: 'asc' },
    });

    const datos = tiposPapel.map((papel) => {
      const stockTotal = papel.stocks.reduce((acc, stock) => acc + stock.cantidadActual, 0);
      const valorTotal = stockTotal * Number(papel.costoUnitario);

      return {
        id: papel.id,
        codigo: papel.codigo,
        descripcion: papel.descripcion,
        costoUnitario: Number(papel.costoUnitario),
        stockTotal,
        valorTotal,
        stocksPorAlmacen: papel.stocks.map(s => ({
          almacenId: s.almacenId,
          almacenNombre: s.almacen.nombre,
          cantidad: s.cantidadActual,
        })),
      };
    });

    res.json(datos);
  } catch (error) {
    console.error('Error en getReporteStockValor:', error);
    res.status(500).json({ error: 'Error al generar el reporte de valor de stock' });
  }
};

export const getReporteConsumoArea = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin, areaId } = req.query;

    const where: any = {};
    aplicarFiltroFechas(where, 'fechaAsignacion', fechaInicio, fechaFin);

    if (areaId) {
      where.periferico = { areaId };
    }

    const asignaciones = await prisma.asignacionPeriferico.findMany({
      where,
      include: {
        tipoPapel: true,
        periferico: {
          include: {
            area: true,
          },
        },
        usuario: true,
      },
      orderBy: { fechaAsignacion: 'desc' },
    });

    res.json(asignaciones);
  } catch (error) {
    console.error('Error en getReporteConsumoArea:', error);
    res.status(500).json({ error: 'Error al generar el reporte de consumo por área' });
  }
};

export const getReporteConsumoAlmacen = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin, almacenId } = req.query;

    const where: any = {
      tipoMovimiento: { in: ['SALIDA', 'MERMA'] },
    };
    aplicarFiltroFechas(where, 'fechaMovimiento', fechaInicio, fechaFin);

    if (almacenId) {
      where.almacenOrigenId = almacenId;
    }

    const salidas = await prisma.movimientoInventario.findMany({
      where,
      include: {
        tipoPapel: true,
        almacenOrigen: true,
        usuario: true,
      },
      orderBy: { fechaMovimiento: 'desc' },
    });

    res.json(salidas);
  } catch (error) {
    console.error('Error en getReporteConsumoAlmacen:', error);
    res.status(500).json({ error: 'Error al generar el reporte de consumo por almacén' });
  }
};

export const getReporteMovimientosIngeniero = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin, usuarioId, tipoMovimiento } = req.query;
    const where: any = {};
    aplicarFiltroFechas(where, 'fechaMovimiento', fechaInicio, fechaFin);

    if (usuarioId) where.usuarioId = usuarioId;
    if (tipoMovimiento) where.tipoMovimiento = tipoMovimiento;

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: { tipoPapel: true, almacenOrigen: true, almacenDestino: true, usuario: true },
      orderBy: { fechaMovimiento: 'desc' },
    });
    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar reporte de ingeniero' });
  }
};

export const getReporteKioskosAbastecidos = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const where: any = {
      accion: { contains: 'Cambio de Papel' }
    };
    aplicarFiltroFechas(where, 'fecha', fechaInicio, fechaFin);
    
    const intervenciones = await prisma.intervencionKiosko.findMany({
      where,
      include: { 
        periferico: true, 
        ingeniero: true,
        almacenOrigen: true
      },
      orderBy: { fecha: 'desc' },
    });
    
    res.json(intervenciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar reporte de kioskos' });
  }
};

export const getReporteIncidentes = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin, estado } = req.query;
    const where: any = {};
    aplicarFiltroFechas(where, 'fechaIncidente', fechaInicio, fechaFin);
    if (estado) where.estado = estado;
    
    const incidentes = await prisma.incidenteDiscrepancia.findMany({
      where,
      include: { ingeniero: true },
      orderBy: { fechaIncidente: 'desc' },
    });
    res.json(incidentes);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar reporte de incidentes' });
  }
};

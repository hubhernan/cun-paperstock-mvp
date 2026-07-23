import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getReporteMovimientos = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin, tipoMovimiento } = req.query;

    const where: any = {};

    if (fechaInicio || fechaFin) {
      where.fechaMovimiento = {};
      if (fechaInicio) where.fechaMovimiento.gte = new Date(fechaInicio as string);
      if (fechaFin) {
        const endDate = new Date(fechaFin as string);
        endDate.setHours(23, 59, 59, 999);
        where.fechaMovimiento.lte = endDate;
      }
    }

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

    // Mapear los datos para devolver un arreglo plano para la tabla/reporte
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

    if (fechaInicio || fechaFin) {
      where.fechaAsignacion = {};
      if (fechaInicio) where.fechaAsignacion.gte = new Date(fechaInicio as string);
      if (fechaFin) {
        const endDate = new Date(fechaFin as string);
        endDate.setHours(23, 59, 59, 999);
        where.fechaAsignacion.lte = endDate;
      }
    }

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

    if (fechaInicio || fechaFin) {
      where.fechaMovimiento = {};
      if (fechaInicio) where.fechaMovimiento.gte = new Date(fechaInicio as string);
      if (fechaFin) {
        const endDate = new Date(fechaFin as string);
        endDate.setHours(23, 59, 59, 999);
        where.fechaMovimiento.lte = endDate;
      }
    }

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

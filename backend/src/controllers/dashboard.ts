import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getKPIs = async (req: Request, res: Response) => {
  try {
    // 1. Total tipos de papel
    const totalTiposPapel = await prisma.tipoPapel.count();

    // 2. Stock Total (Unidades)
    const stockAgrupado = await prisma.stockAlmacen.aggregate({
      _sum: { cantidadActual: true }
    });
    const stockTotal = stockAgrupado._sum.cantidadActual || 0;

    // 3. Consumo Hoy (Salidas, Mermas o Asignaciones de hoy)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const salidasHoy = await prisma.movimientoInventario.aggregate({
      where: {
        tipoMovimiento: { in: ['SALIDA', 'MERMA'] },
        fechaMovimiento: { gte: hoy }
      },
      _sum: { cantidad: true }
    });
    const consumoHoy = salidasHoy._sum.cantidad || 0;

    // 4. Alertas de Stock (Tipos de papel cuyo stock global es menor al mínimo)
    // Para simplificar: buscar qué tipos de papel tienen su stock total (suma de todos los almacenes) por debajo del stockMinimo
    const stockPorPapel = await prisma.stockAlmacen.groupBy({
      by: ['tipoPapelId'],
      _sum: { cantidadActual: true }
    });

    const tiposPapel = await prisma.tipoPapel.findMany();
    
    let alertasStock = 0;
    tiposPapel.forEach(tp => {
      const stock = stockPorPapel.find(s => s.tipoPapelId === tp.id)?._sum.cantidadActual || 0;
      if (stock <= tp.stockMinimo) {
        alertasStock++;
      }
    });

    res.json({
      success: true,
      data: {
        totalTiposPapel,
        stockTotal,
        consumoHoy,
        alertasStock
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener KPIs' });
  }
};

export const getChartData = async (req: Request, res: Response) => {
  try {
    // 1. Consumo Histórico (Últimos 7 días)
    const fechaHace7Dias = new Date();
    fechaHace7Dias.setDate(fechaHace7Dias.getDate() - 6);
    fechaHace7Dias.setHours(0, 0, 0, 0);

    const asignaciones = await prisma.asignacionPeriferico.findMany({
      where: { fechaAsignacion: { gte: fechaHace7Dias } },
      include: { tipoPapel: true }
    });

    const consumoHistoricoMap: Record<string, { ATB: number; BTP: number; Otros: number }> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(fechaHace7Dias);
      date.setDate(date.getDate() + i);
      const formattedDate = date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
      consumoHistoricoMap[formattedDate] = { ATB: 0, BTP: 0, Otros: 0 };
    }

    asignaciones.forEach(a => {
      const formattedDate = new Date(a.fechaAsignacion).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
      if (consumoHistoricoMap[formattedDate]) {
        const codigo = a.tipoPapel.codigo.toUpperCase();
        if (codigo.includes('ATB')) {
          consumoHistoricoMap[formattedDate].ATB += a.cantidadAsignada;
        } else if (codigo.includes('BTP')) {
          consumoHistoricoMap[formattedDate].BTP += a.cantidadAsignada;
        } else {
          consumoHistoricoMap[formattedDate].Otros += a.cantidadAsignada;
        }
      }
    });

    const consumoHistorico = Object.keys(consumoHistoricoMap).map(fecha => ({
      fecha,
      ATB: consumoHistoricoMap[fecha].ATB,
      BTP: consumoHistoricoMap[fecha].BTP,
      Otros: consumoHistoricoMap[fecha].Otros
    }));

    // 2. Distribución de Stock por Almacén
    const stockAgrupado = await prisma.stockAlmacen.findMany({
      include: { almacen: true }
    });
    
    const stockPorAlmacenMap: Record<string, number> = {};
    stockAgrupado.forEach(s => {
      if (s.cantidadActual > 0) {
        const nombre = s.almacen.nombre;
        stockPorAlmacenMap[nombre] = (stockPorAlmacenMap[nombre] || 0) + s.cantidadActual;
      }
    });

    const stockPorAlmacen = Object.keys(stockPorAlmacenMap).map(nombre => ({
      nombre,
      valor: stockPorAlmacenMap[nombre]
    }));

    // 3. Top Tipos de Papel Consumidos (Total histórico)
    const asignacionesHistoricas = await prisma.asignacionPeriferico.findMany({
      include: { tipoPapel: true }
    });

    const consumoPorTipoMap: Record<string, number> = {};
    asignacionesHistoricas.forEach(a => {
      const codigo = a.tipoPapel.codigo;
      consumoPorTipoMap[codigo] = (consumoPorTipoMap[codigo] || 0) + a.cantidadAsignada;
    });

    const consumoPorTipo = Object.keys(consumoPorTipoMap).map(nombre => ({
      nombre,
      valor: consumoPorTipoMap[nombre]
    })).sort((a, b) => b.valor - a.valor); // Ordenar de mayor a menor

    res.json({
      success: true,
      data: {
        consumoHistorico,
        stockPorAlmacen,
        consumoPorTipo
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener datos de gráficas' });
  }
};

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getKPIs = async (req: Request, res: Response) => {
  try {
    // 1. Total tipos de papel
    const totalTiposPapel = await prisma.tipoPapel.count();

    // 2. Stock Total (Unidades desglosadas)
    const stocks = await prisma.stockAlmacen.findMany({
      include: { tipoPapel: true }
    });
    let stockAtb = 0;
    let stockBtp = 0;
    stocks.forEach(s => {
      const code = s.tipoPapel.codigo.toUpperCase();
      if (code.includes('ATB')) {
        stockAtb += s.cantidadActual;
      } else if (code.includes('BTP')) {
        stockBtp += s.cantidadActual;
      }
    });
    const stockTotal = stockAtb + stockBtp;

    // 3. Consumo Hoy (Salidas, Mermas o Asignaciones de hoy)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const movimientosHoy = await prisma.movimientoInventario.findMany({
      where: {
        tipoMovimiento: { in: ['SALIDA', 'MERMA'] },
        fechaMovimiento: { gte: hoy }
      },
      include: { tipoPapel: true }
    });

    let consumoHoyAtb = 0;
    let consumoHoyBtp = 0;
    movimientosHoy.forEach(m => {
      const code = m.tipoPapel.codigo.toUpperCase();
      if (code.includes('ATB')) {
        consumoHoyAtb += m.cantidad;
      } else if (code.includes('BTP')) {
        consumoHoyBtp += m.cantidad;
      }
    });
    const consumoHoy = consumoHoyAtb + consumoHoyBtp;

    // 4. Alertas de Stock (Tipos de papel cuyo stock global es menor al mínimo)
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
        stockAtb,
        stockBtp,
        consumoHoy,
        consumoHoyAtb,
        consumoHoyBtp,
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
      ATB: consumoHistoricoMap[fecha]?.ATB || 0,
      BTP: consumoHistoricoMap[fecha]?.BTP || 0,
      Otros: consumoHistoricoMap[fecha]?.Otros || 0
    }));

    // Inyección de datos simulados/ficticios si no hay consumos reales en los últimos 7 días
    const totalConsumo = consumoHistorico.reduce((sum, h) => sum + h.ATB + h.BTP + h.Otros, 0);
    if (totalConsumo === 0) {
      const mockValues = [
        { ATB: 35, BTP: 45, Otros: 10 },
        { ATB: 42, BTP: 38, Otros: 8 },
        { ATB: 28, BTP: 52, Otros: 12 },
        { ATB: 50, BTP: 40, Otros: 15 },
        { ATB: 33, BTP: 47, Otros: 9 },
        { ATB: 48, BTP: 35, Otros: 11 },
        { ATB: 55, BTP: 60, Otros: 20 }
      ];
      consumoHistorico.forEach((day, index) => {
        const mockVal = mockValues[index];
        if (mockVal) {
          day.ATB = mockVal.ATB;
          day.BTP = mockVal.BTP;
          day.Otros = mockVal.Otros;
        }
      });
    }

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

    // 3. Consumo por Terminal (ATB vs BTP)
    const asignacionesHistoricas = await prisma.asignacionPeriferico.findMany({
      include: { tipoPapel: true, periferico: { include: { area: true } } }
    });

    const terminalMap: Record<string, { ATB: number; BTP: number }> = {
      'Terminal 2': { ATB: 0, BTP: 0 },
      'Terminal 3': { ATB: 0, BTP: 0 },
      'Terminal 4': { ATB: 0, BTP: 0 },
      'Otros': { ATB: 0, BTP: 0 }
    };

    if (asignacionesHistoricas.length === 0) {
      // Inyección de consumos de terminal ficticios para demostración si está vacío
      terminalMap['Terminal 2'] = { ATB: 180, BTP: 220 };
      terminalMap['Terminal 3'] = { ATB: 310, BTP: 290 };
      terminalMap['Terminal 4'] = { ATB: 240, BTP: 350 };
      terminalMap['Otros'] = { ATB: 80, BTP: 90 };
    } else {
      asignacionesHistoricas.forEach(a => {
        let termName = a.periferico?.area?.terminal || 'Otros';
        if (termName.toUpperCase().includes('T2') || termName.toUpperCase().includes('TERMINAL 2')) {
          termName = 'Terminal 2';
        } else if (termName.toUpperCase().includes('T3') || termName.toUpperCase().includes('TERMINAL 3')) {
          termName = 'Terminal 3';
        } else if (termName.toUpperCase().includes('T4') || termName.toUpperCase().includes('TERMINAL 4')) {
          termName = 'Terminal 4';
        } else {
          termName = 'Otros';
        }

        const mapping = terminalMap[termName];
        if (mapping) {
          const codigo = a.tipoPapel.codigo.toUpperCase();
          if (codigo.includes('ATB')) {
            mapping.ATB += a.cantidadAsignada;
          } else if (codigo.includes('BTP')) {
            mapping.BTP += a.cantidadAsignada;
          }
        }
      });
    }

    const consumoPorTerminal = Object.keys(terminalMap).map(term => ({
      terminal: term,
      ATB: terminalMap[term]?.ATB || 0,
      BTP: terminalMap[term]?.BTP || 0
    }));

    // 4. Historial de Stock Semanal por Almacén (Últimas 4 semanas)
    const almacenesDb = await prisma.almacen.findMany();
    const centralAlm = almacenesDb.find(a => a.nombre.toLowerCase().includes('central'));
    const t3Alm = almacenesDb.find(a => a.ubicacion.toLowerCase().includes('terminal 3') || a.nombre.toLowerCase().includes('terminal 3'));
    const t4Alm = almacenesDb.find(a => a.ubicacion.toLowerCase().includes('terminal 4') || a.nombre.toLowerCase().includes('terminal 4'));

    const stocksAll = await prisma.stockAlmacen.findMany();
    const centralStockCurrent = stocksAll.filter(s => s.almacenId === centralAlm?.id).reduce((sum, s) => sum + s.cantidadActual, 0);
    const t3StockCurrent = stocksAll.filter(s => s.almacenId === t3Alm?.id).reduce((sum, s) => sum + s.cantidadActual, 0);
    const t4StockCurrent = stocksAll.filter(s => s.almacenId === t4Alm?.id).reduce((sum, s) => sum + s.cantidadActual, 0);

    const todosMovimientos = await prisma.movimientoInventario.findMany({
      orderBy: { fechaMovimiento: 'desc' }
    });

    const getStockAtDate = (warehouseId: string | undefined, currentStock: number, cutoffDate: Date) => {
      if (!warehouseId) return currentStock;
      let stock = currentStock;
      
      todosMovimientos.forEach(m => {
        if (new Date(m.fechaMovimiento) > cutoffDate) {
          if (m.almacenDestinoId === warehouseId) {
            stock -= m.cantidad;
          }
          if (m.almacenOrigenId === warehouseId) {
            stock += m.cantidad;
          }
        }
      });
      return Math.max(0, stock);
    };

    const stockSemanal = [];
    const hoy = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const cutoffDate = new Date(hoy);
      cutoffDate.setDate(hoy.getDate() - i * 7);
      
      const semLabel = i === 0 ? 'Actual' : `Hace ${i} sem`;
      
      stockSemanal.push({
        semana: semLabel,
        'Almacén Central': getStockAtDate(centralAlm?.id, centralStockCurrent, cutoffDate),
        'Almacén T3': getStockAtDate(t3Alm?.id, t3StockCurrent, cutoffDate),
        'Almacén T4': getStockAtDate(t4Alm?.id, t4StockCurrent, cutoffDate),
      });
    }

    res.json({
      success: true,
      data: {
        consumoHistorico,
        stockPorAlmacen,
        consumoPorTerminal,
        stockSemanal
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener datos de gráficas' });
  }
};

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllAlmacenes = async (req: Request, res: Response) => {
  try {
    const almacenes = await prisma.almacen.findMany({
      include: {
        stocks: {
          include: { tipoPapel: true }
        }
      }
    });

    // Añadir inteligencia (KPIs predictivos)
    const almacenesConInteligencia = almacenes.map(almacen => {
      // Sumar stock por código
      const stockATB = almacen.stocks
        .filter(s => s.tipoPapel.codigo.includes('ATB'))
        .reduce((sum, s) => sum + s.cantidadActual, 0);
        
      const stockBTP = almacen.stocks
        .filter(s => s.tipoPapel.codigo.includes('BTP'))
        .reduce((sum, s) => sum + s.cantidadActual, 0);

      // Calcular consumo semanal simulado o fijo por ahora (Fase 2 MVP)
      const consumoPromedioATB = 25; // Rollos por semana (Ficticio para MVP)
      const consumoPromedioBTP = 150; 

      const diasCoberturaATB = consumoPromedioATB > 0 ? Math.floor((stockATB / consumoPromedioATB) * 7) : 99;
      const diasCoberturaBTP = consumoPromedioBTP > 0 ? Math.floor((stockBTP / consumoPromedioBTP) * 7) : 99;

      // Estado Visual BTP (T3 y T4 mínimo)
      let estadoVisual = 'VERDE';
      if (stockBTP < 20) estadoVisual = 'ROJO';
      else if (stockBTP < 60) estadoVisual = 'AMBAR';

      // Sugerencia
      let sugerencia = null;
      if (estadoVisual === 'ROJO' && (almacen.nombre.includes('T3') || almacen.nombre.includes('Terminal 3'))) {
        sugerencia = `Transferir 60 BTP desde T2 (Almacén Principal) hacia Terminal 3`;
      } else if (estadoVisual === 'ROJO' && (almacen.nombre.includes('T4') || almacen.nombre.includes('Terminal 4'))) {
        sugerencia = `Transferir 30 BTP desde T2 hacia Terminal 4`;
      }

      return {
        ...almacen,
        stockATB,
        stockBTP,
        estadoVisual,
        diasCobertura: Math.min(diasCoberturaATB, diasCoberturaBTP), // El más crítico
        sugerencia
      };
    });

    res.json({ success: true, data: almacenesConInteligencia });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener almacenes' });
  }
};

export const createAlmacen = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const nuevoAlmacen = await prisma.almacen.create({
      data: {
        nombre: data.nombre,
        ubicacion: data.ubicacion,
        capacidad: data.capacidad,
        responsableId: data.responsableId
      }
    });
    res.json({ success: true, data: nuevoAlmacen, message: 'Almacén creado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear almacén' });
  }
};

export const getStockAlmacen = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const stock = await prisma.stockAlmacen.findMany({
      where: { almacenId: id },
      include: {
        tipoPapel: true
      }
    });

    // Agrupar por tipo de papel (sin considerar lotes)
    const stockConsolidadoMap: Record<string, any> = {};
    stock.forEach(item => {
      const tipoId = item.tipoPapelId;
      if (!stockConsolidadoMap[tipoId]) {
        stockConsolidadoMap[tipoId] = {
          id: item.id,
          tipoPapelId: item.tipoPapelId,
          tipoPapel: item.tipoPapel,
          cantidadActual: 0
        };
      }
      stockConsolidadoMap[tipoId].cantidadActual += item.cantidadActual;
    });

    const data = Object.values(stockConsolidadoMap);
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener stock del almacén' });
  }
};

export const verificarStockAlmacen = async (req: Request, res: Response) => {
  try {
    const { almacenId, tipoPapelId, stockCalculado, stockFisico, comentarios } = req.body;
    const ingenieroId = (req as any).user.id;

    const [almacen, tipoPapel] = await Promise.all([
      prisma.almacen.findUnique({ where: { id: almacenId } }),
      prisma.tipoPapel.findUnique({ where: { id: tipoPapelId } })
    ]);

    if (!almacen || !tipoPapel) {
      return res.status(404).json({ success: false, message: 'Almacén o Tipo de Papel no encontrado.' });
    }

    const calcNum = Number(stockCalculado);
    const fisicNum = Number(stockFisico);
    const diferencia = fisicNum - calcNum;

    if (diferencia === 0) {
      // CONTEO CORRECTO
      await prisma.auditoriaAcciones.create({
        data: {
          usuarioId: ingenieroId,
          accion: 'VERIFICACION_STOCK_OK',
          entidad: 'Almacen',
          entidadId: almacenId,
          detalles: `Stock verificado 100% correcto: ${fisicNum} rollos de ${tipoPapel.codigo} en ${almacen.nombre}`
        }
      });

      return res.json({
        success: true,
        message: `Stock de ${tipoPapel.codigo} verificado correctamente (${fisicNum} rollos).`
      });
    } else {
      // DISCREPANCIA REPORTADA (Meramente Informativa - Incidente + Auditoría, Stock intacto)
      await prisma.$transaction(async (tx) => {
        const nuevoIncidente = await tx.incidenteDiscrepancia.create({
          data: {
            terminal: almacen.nombre,
            ingenieroId,
            stockCalculado: calcNum,
            stockFisico: fisicNum,
            diferencia: diferencia,
            comentarios: comentarios ? `[Discrepancia Informativa en Almacén] ${comentarios}` : `Diferencia informativa de ${diferencia} rollos de ${tipoPapel.codigo} en ${almacen.nombre} (Stock del sistema conservado sin alteración)`,
            estado: 'ABIERTO'
          }
        });

        await tx.auditoriaAcciones.create({
          data: {
            usuarioId: ingenieroId,
            accion: 'REPORTE_DISCREPANCIA_INFORMATIVA_ALMACEN',
            entidad: 'IncidenteDiscrepancia',
            entidadId: nuevoIncidente.id,
            detalles: `Discrepancia informativa en ${almacen.nombre}: Sistema ${calcNum} vs Físico ${fisicNum} (${tipoPapel.codigo}). Stock conservado intacto.`
          }
        });
      });

      return res.json({
        success: true,
        message: `Discrepancia registrada de forma informativa (${diferencia > 0 ? '+' : ''}${diferencia} rollos). El stock en el sistema no ha sido alterado y se abrió un incidente para su investigación.`
      });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Error al verificar stock' });
  }
};

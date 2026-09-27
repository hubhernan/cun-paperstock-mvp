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
      // CONTEO CORRECTO - FIRMA Y REGISTRO DE VERIFICACIÓN
      const usuario = await prisma.usuario.findUnique({ where: { id: ingenieroId } });
      const usuarioNombre = usuario ? usuario.nombre : 'INGENIERO DE CAMPO';

      let termDesc = 'Stock Almacén OK';
      if (almacen.nombre.includes('Terminal 2') || almacen.nombre.includes('T2')) termDesc = 'Stock T2 OK';
      else if (almacen.nombre.includes('Terminal 3') || almacen.nombre.includes('T3')) termDesc = 'Stock T3 OK';
      else if (almacen.nombre.includes('Terminal 4') || almacen.nombre.includes('T4')) termDesc = 'Stock T4 OK';

      const papelCode = tipoPapel.codigo.toUpperCase().includes('ATB') ? 'ATB' : (tipoPapel.codigo.toUpperCase().includes('BTP') ? 'BTP' : tipoPapel.codigo);

      const auditPayload = {
        descripcion: termDesc,
        papel: papelCode,
        cantidad: fisicNum,
        almacenNombre: almacen.nombre,
        usuarioNombre: usuarioNombre
      };

      await prisma.auditoriaAcciones.create({
        data: {
          usuarioId: ingenieroId,
          accion: 'VERIFICACION_STOCK_OK',
          entidad: 'Almacen',
          entidadId: almacenId,
          detalles: JSON.stringify(auditPayload)
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

export const getVerificacionesStock = async (req: Request, res: Response) => {
  try {
    const { almacenId } = req.query;

    const whereClause: any = {
      accion: 'VERIFICACION_STOCK_OK'
    };

    if (almacenId && typeof almacenId === 'string') {
      whereClause.entidadId = almacenId;
    }

    const auditorias = await prisma.auditoriaAcciones.findMany({
      where: whereClause,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      },
      take: 200
    });

    const almacenes = await prisma.almacen.findMany();
    const almacenesMap = new Map(almacenes.map(a => [a.id, a.nombre]));

    const result = auditorias.map(item => {
      let descripcion = 'Stock OK';
      let papel = 'ATB';
      let cantidad = 0;
      let usuarioNombre = item.usuario?.nombre || 'INGENIERO DE CAMPO';

      const almacenNombre = item.entidadId ? almacenesMap.get(item.entidadId) || 'Almacén' : 'Almacén';
      if (almacenNombre.includes('Terminal 2') || almacenNombre.includes('T2')) descripcion = 'Stock T2 OK';
      else if (almacenNombre.includes('Terminal 3') || almacenNombre.includes('T3')) descripcion = 'Stock T3 OK';
      else if (almacenNombre.includes('Terminal 4') || almacenNombre.includes('T4')) descripcion = 'Stock T4 OK';

      if (item.detalles) {
        try {
          if (item.detalles.startsWith('{')) {
            const parsed = JSON.parse(item.detalles);
            if (parsed.descripcion) descripcion = parsed.descripcion;
            if (parsed.papel) papel = parsed.papel;
            if (typeof parsed.cantidad === 'number') cantidad = parsed.cantidad;
            if (parsed.usuarioNombre) usuarioNombre = parsed.usuarioNombre;
          } else {
            if (item.detalles.includes('BTP')) papel = 'BTP';
            else if (item.detalles.includes('ATB')) papel = 'ATB';

            const cantMatch = item.detalles.match(/(\d+)\s+rollos/);
            if (cantMatch && cantMatch[1]) {
              cantidad = parseInt(cantMatch[1], 10);
            }
          }
        } catch (e) {
          // fallback
        }
      }

      const d = new Date(item.fecha);
      const meses = ['Sep', 'Sep', 'Sep', 'Sep', 'Sep', 'Sep', 'Sep', 'Sep', 'Sep', 'Oct', 'Nov', 'Dic'];
      // Use date-fns or simple JS date formatting
      const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const dia = d.getDate();
      const mes = mesesNombres[d.getMonth()];
      const anio = d.getFullYear();
      const fechaFormatted = `${dia} ${mes} ${anio}`;
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const horaFormatted = `${hh}:${mm}`;

      return {
        id: item.id,
        fecha: item.fecha,
        fechaFormatted,
        horaFormatted,
        descripcion,
        papel,
        cantidad,
        usuario: usuarioNombre,
        almacenNombre
      };
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error al obtener verificaciones de stock:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener verificaciones de stock' });
  }
};

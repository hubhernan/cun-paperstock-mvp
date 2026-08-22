import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
let alertIntervalId: NodeJS.Timeout | null = null;

// Mapa para evitar spam de la misma alerta (ID Kiosko -> último nivel reportado)
const lastAlertState: Record<string, string> = {};

export const clearKioskoAlertState = (kioskoId: string) => {
  delete lastAlertState[kioskoId];
};

export const sincronizarAlertasConPerifericos = async (dbClient: any = prisma) => {
  try {
    const kioskos = await dbClient.periferico.findMany({
      where: { estadoOperativo: 'ACTIVO' },
      include: {
        asignaciones: {
          include: { tipoPapel: true },
          orderBy: { fechaAsignacion: 'desc' },
          take: 1
        },
        area: true
      }
    });

    const tiposPapel = await dbClient.tipoPapel.findMany();
    const papelAtb = tiposPapel.find((tp: any) => tp.codigo.toUpperCase().includes('ATB')) || tiposPapel[0];
    const papelBtp = tiposPapel.find((tp: any) => tp.codigo.toUpperCase().includes('BTP')) || tiposPapel[0];

    for (const kiosko of kioskos) {
      const atb = kiosko.nivelAtb;
      const btp = kiosko.nivelBtp;
      const atbCritico = atb <= 20;
      const btpCritico = btp <= 20;
      const idKioskoCodigo = kiosko.identificadorUnico;

      if (!atbCritico && !btpCritico) {
        await dbClient.alertaStock.updateMany({
          where: {
            leida: false,
            mensaje: { contains: idKioskoCodigo }
          },
          data: { leida: true }
        });
        continue;
      }

      let lowType = '';
      if (atbCritico && btpCritico) {
        lowType = 'ATB y BTP';
      } else if (atbCritico) {
        lowType = 'ATB';
      } else {
        lowType = 'BTP';
      }

      const worstNivel = Math.min(atb, btp);
      const estadoNombre = worstNivel <= 10 ? 'Rojo' : 'Naranja';
      const areaNombre = kiosko.area?.nombre || 'Kioskos en Sitio';
      const nuevoMensaje = `Kiosko ${idKioskoCodigo} en ${areaNombre} tiene nivel crítico de ${lowType} (semáforo en ${estadoNombre}).`;
      const targetPapelId = atbCritico ? papelAtb?.id : papelBtp?.id;

      const alertaExistente = await dbClient.alertaStock.findFirst({
        where: {
          leida: false,
          mensaje: { contains: idKioskoCodigo }
        }
      });

      if (alertaExistente) {
        await dbClient.alertaStock.update({
          where: { id: alertaExistente.id },
          data: {
            mensaje: nuevoMensaje,
            fecha: new Date(),
            tipoPapelId: targetPapelId || alertaExistente.tipoPapelId
          }
        });
      } else {
        await dbClient.alertaStock.create({
          data: {
            tipoPapelId: targetPapelId || papelAtb?.id,
            mensaje: nuevoMensaje,
            leida: false
          }
        });
      }
    }
  } catch (err) {
    console.error('Error sincronizando alertas con periféricos:', err);
  }
};

export const startAlertService = () => {
  if (alertIntervalId) return;

  console.log('🚨 Alert Service started (Monitorización de umbrales)');
  
  // Ejecutar inmediatamente y luego cada 10 segundos
  sincronizarAlertasConPerifericos().catch(err => console.error(err));

  alertIntervalId = setInterval(async () => {
    try {
      // 1. MONITORIZACIÓN DE STOCK GLOBAL (Almacenes)
      const tiposPapel = await prisma.tipoPapel.findMany();
      const stockAgrupado = await prisma.stockAlmacen.groupBy({
        by: ['tipoPapelId'],
        _sum: { cantidadActual: true }
      });

      for (const tp of tiposPapel) {
        const stockActual = stockAgrupado.find(s => s.tipoPapelId === tp.id)?._sum.cantidadActual || 0;
        const stateKey = `global-${tp.id}-${stockActual <= tp.stockMinimo}`;
        
        if (stockActual <= tp.stockMinimo && lastAlertState[`global-${tp.id}`] !== stateKey) {
          lastAlertState[`global-${tp.id}`] = stateKey;
          const mensaje = `¡ALERTA GLOBAL! El stock total de ${tp.descripcion} (${stockActual} uds) ha caído por debajo del mínimo permitido (${tp.stockMinimo} uds).`;
          await prisma.alertaStock.create({
            data: {
              tipoPapelId: tp.id,
              mensaje: mensaje
            }
          });
        } else if (stockActual > tp.stockMinimo) {
          if (lastAlertState[`global-${tp.id}`]) {
            delete lastAlertState[`global-${tp.id}`];
          }
        }
      }

        // 2. MONITORIZACIÓN Y SINCRONIZACIÓN DE KIOSKOS
      await sincronizarAlertasConPerifericos();
    } catch (error) {
      console.error('❌ Error in AlertService:', error);
    }
  }, 10000);
};

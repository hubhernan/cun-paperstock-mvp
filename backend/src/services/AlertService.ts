import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
let alertIntervalId: NodeJS.Timeout | null = null;

// Mapa para evitar spam de la misma alerta (ID Kiosko -> último nivel reportado)
const lastAlertState: Record<string, string> = {};

export const clearKioskoAlertState = (kioskoId: string) => {
  delete lastAlertState[kioskoId];
};

export const startAlertService = () => {
  if (alertIntervalId) return;

  console.log('🚨 Alert Service started (Monitorización de umbrales)');
  
  // Ejecutar cada 15 segundos
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

      // 2. MONITORIZACIÓN DE KIOSKOS (Telemetría)
      const kioskos = await prisma.periferico.findMany({
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

      for (const kiosko of kioskos) {
        const atb = kiosko.nivelAtb;
        const btp = kiosko.nivelBtp;
        let severity = 'OK';
        
        const worstNivel = Math.min(atb, btp);

        if (worstNivel <= 5) {
          severity = 'CRITICA';
        } else if (worstNivel <= 10) {
          severity = 'NIVEL_2';
        } else if (worstNivel <= 20) {
          severity = 'NIVEL_1';
        }

        const stateKey = `${kiosko.id}-${severity}`;

        // Auto-resolver alertas por insumo si el nivel de ese insumo es adecuado (> 20)
        if (atb > 20) {
          await prisma.alertaStock.updateMany({
            where: {
              leida: false,
              mensaje: { contains: kiosko.identificadorUnico },
              AND: { mensaje: { contains: 'ATB' } }
            },
            data: { leida: true }
          });
        }

        if (btp > 20) {
          await prisma.alertaStock.updateMany({
            where: {
              leida: false,
              mensaje: { contains: kiosko.identificadorUnico },
              AND: { mensaje: { contains: 'BTP' } }
            },
            data: { leida: true }
          });
        }

        // Si hay una alerta y es diferente a la última reportada para este kiosko
        if (severity !== 'OK' && lastAlertState[kiosko.id] !== stateKey) {
          lastAlertState[kiosko.id] = stateKey;

          const tipoPapelAsignado = kiosko.asignaciones[0]?.tipoPapel;
          const lowType = atb <= btp ? 'ATB' : 'BTP';
          const mensaje = `Kiosko ${kiosko.identificadorUnico} en ${kiosko.area.nombre} tiene nivel crítico de ${lowType} (semáforo en Rojo).`;

          let targetPapelId = tipoPapelAsignado?.id;
          if (!targetPapelId) {
            const firstPapel = await prisma.tipoPapel.findFirst({
              where: { codigo: { contains: lowType, mode: 'insensitive' } }
            }) || await prisma.tipoPapel.findFirst();
            targetPapelId = firstPapel?.id;
          }

          if (targetPapelId) {
            const alertaExistente = await prisma.alertaStock.findFirst({
              where: {
                leida: false,
                mensaje: { contains: kiosko.identificadorUnico }
              }
            });

            if (alertaExistente) {
              await prisma.alertaStock.update({
                where: { id: alertaExistente.id },
                data: {
                  mensaje: mensaje,
                  fecha: new Date(),
                  tipoPapelId: targetPapelId
                }
              });
            } else {
              await prisma.alertaStock.create({
                data: {
                  tipoPapelId: targetPapelId,
                  mensaje: mensaje
                }
              });
            }
          }
        } else if (severity === 'OK') {
          if (lastAlertState[kiosko.id]) {
             delete lastAlertState[kiosko.id];
          }
          await prisma.alertaStock.updateMany({
            where: {
              leida: false,
              mensaje: { contains: kiosko.identificadorUnico }
            },
            data: { leida: true }
          });
        }
      }
    } catch (error) {
      console.error('❌ Error in AlertService:', error);
    }
  }, 15000);
};

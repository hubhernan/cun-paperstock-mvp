import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
let alertIntervalId: NodeJS.Timeout | null = null;

// Mapa para evitar spam de la misma alerta (ID Kiosko -> último nivel reportado)
const lastAlertState: Record<string, string> = {};

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
          
          const nuevaAlerta = await prisma.alertaStock.create({
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
      // Obtener todos los kioskos activos y sus asignaciones para saber el tipo de papel
      const kioskos = await prisma.periferico.findMany({
        where: { estadoOperativo: 'ACTIVO' },
        include: {
          asignaciones: {
            include: { tipoPapel: true },
            orderBy: { fechaAsignacion: 'desc' },
            take: 1 // Última asignación para saber qué papel tiene
          },
          area: true
        }
      });

      for (const kiosko of kioskos) {
        const atb = kiosko.nivelAtb;
        const btp = kiosko.nivelBtp;
        const estado = kiosko.estadoConexion;
        let severity = 'OK';
        
        const worstNivel = Math.min(atb, btp);

        if (estado === 'OFFLINE') {
          severity = 'OFFLINE';
        } else if (worstNivel <= 5) {
          severity = 'CRITICA';
        } else if (worstNivel <= 10) {
          severity = 'NIVEL_2';
        } else if (worstNivel <= 20) {
          severity = 'NIVEL_1';
        }

        const stateKey = `${kiosko.id}-${severity}`;

        // Si hay una alerta y es diferente a la última reportada para este kiosko
        if (severity !== 'OK' && lastAlertState[kiosko.id] !== stateKey) {
          lastAlertState[kiosko.id] = stateKey; // Registrar que ya alertamos esto

          const tipoPapelAsignado = kiosko.asignaciones[0]?.tipoPapel;
          let mensaje = '';
          
          if (severity === 'OFFLINE') {
            mensaje = `Kiosko ${kiosko.modelo} en ${kiosko.area.nombre} se encuentra OFFLINE.`;
          } else {
            const lowType = atb <= btp ? 'ATB' : 'BTP';
            mensaje = `Kiosko ${kiosko.modelo} en ${kiosko.area.nombre} tiene nivel crítico de ${lowType}: ${worstNivel}% restante.`;
          }

          if (tipoPapelAsignado) {
            // Guardar alerta en base de datos
            const nuevaAlerta = await prisma.alertaStock.create({
              data: {
                tipoPapelId: tipoPapelAsignado.id,
                mensaje: mensaje
              }
            });


          }
        } else if (severity === 'OK') {
          // Resetear si volvió a la normalidad
          if (lastAlertState[kiosko.id]) {
             delete lastAlertState[kiosko.id];
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in AlertService:', error);
    }
  }, 15000); // 15s
};

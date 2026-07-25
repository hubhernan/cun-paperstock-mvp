import { PrismaClient } from '@prisma/client';
import { getIO } from '../socket';

const prisma = new PrismaClient();
let intervalId: NodeJS.Timeout | null = null;

export const startKioskSimulator = () => {
  if (intervalId) return;

  console.log('🤖 Kiosk Simulator started (Telemetría en tiempo real)');
  
  // Ejecutar cada 10 segundos para ver cambios rápidos en el Dashboard
  intervalId = setInterval(async () => {
    try {
      let io;
      try {
        io = getIO();
      } catch (err) {
        // Puede que socket.io no esté listo aún
        return;
      }

      // Obtener todos los kioskos activos
      const kioskos = await prisma.periferico.findMany({
        where: { estadoOperativo: 'ACTIVO' }
      });

      for (const kiosko of kioskos) {
        // Simulador de consumo y estados
        const chance = Math.random();
        
        let newEstado = kiosko.estadoConexion || 'ONLINE';
        let newAtb = kiosko.nivelAtb ?? 100;
        let newBtp = kiosko.nivelBtp ?? 100;

        // 5% de probabilidad de cambiar estado (offline/online)
        if (chance < 0.05) {
          newEstado = newEstado === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
        }

        // Consumo aleatorio si está ONLINE
        let consumoLocal = 0;
        if (newEstado === 'ONLINE' && chance < 0.7) {
          // 70% de probabilidad de consumir papel en esta iteración
          const consumeAtb = Math.floor(Math.random() * 5) + 1; // 1 a 5 impresiones
          const consumeBtp = Math.floor(Math.random() * 3) + 1; // 1 a 3 impresiones
          newAtb = Math.max(0, newAtb - consumeAtb);
          newBtp = Math.max(0, newBtp - consumeBtp);
          consumoLocal = consumeAtb + consumeBtp;
        }

        const isUpdated = newEstado !== kiosko.estadoConexion || newAtb !== kiosko.nivelAtb || newBtp !== kiosko.nivelBtp;

        if (isUpdated) {
          const updatedKiosk = await prisma.periferico.update({
            where: { id: kiosko.id },
            data: {
              estadoConexion: newEstado,
              nivelAtb: newAtb,
              nivelBtp: newBtp,
              ultimoConsumo: new Date(),
              impresionesDiarias: kiosko.impresionesDiarias + consumoLocal
            }
          });

          // Emisión en tiempo real al frontend
          io.emit('kiosk_telemetry_update', {
            perifericoId: updatedKiosk.id,
            estadoConexion: updatedKiosk.estadoConexion,
            nivelAtb: updatedKiosk.nivelAtb,
            nivelBtp: updatedKiosk.nivelBtp,
            ultimoConsumo: updatedKiosk.ultimoConsumo,
            impresionesDiarias: updatedKiosk.impresionesDiarias
          });
        }
      }
    } catch (error) {
      console.error('❌ Error in KioskSimulator:', error);
    }
  }, 10000); // 10s
};

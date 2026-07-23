import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../socket';
import { enviarAlertaStock } from '../services/emailService';

const prisma = new PrismaClient();

export const getAlertas = async (req: Request, res: Response) => {
  try {
    const alertas = await prisma.alertaStock.findMany({
      where: { leida: false },
      include: {
        tipoPapel: true,
      },
      orderBy: { fecha: 'desc' },
      take: 20
    });
    res.json({ success: true, data: alertas });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener alertas' });
  }
};

export const marcarAlertaLeida = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const alerta = await prisma.alertaStock.update({
      where: { id: id as string },
      data: { leida: true },
    });
    res.json({ success: true, data: alerta });
  } catch (error) {
    console.error('Error al marcar alerta como leída:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar alerta' });
  }
};

export const marcarTodasLeidas = async (req: Request, res: Response) => {
  try {
    await prisma.alertaStock.updateMany({
      where: { leida: false },
      data: { leida: true },
    });
    res.json({ success: true, message: 'Todas las alertas marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar todas las alertas como leídas:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar alertas' });
  }
};

export const verificarAlertaStock = async (tx: any, tipoPapelId: string) => {
  // Obtener el tipo de papel y su stock total actual
  const tipoPapel = await tx.tipoPapel.findUnique({
    where: { id: tipoPapelId },
    include: { stocks: { include: { almacen: true } } }
  });

  if (!tipoPapel) return;

  const stockTotal = tipoPapel.stocks.reduce((acc: number, stock: any) => acc + stock.cantidadActual, 0);

  if (stockTotal <= tipoPapel.stockMinimo) {
    // Verificar si ya existe una alerta no leída reciente (últimas 24 horas) para no hacer spam
    const alertaExistente = await tx.alertaStock.findFirst({
      where: {
        tipoPapelId,
        leida: false,
        fecha: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!alertaExistente) {
      const nuevaAlerta = await tx.alertaStock.create({
        data: {
          tipoPapelId,
          mensaje: `El stock de ${tipoPapel.codigo} (${stockTotal}) ha caído por debajo o igual al mínimo permitido (${tipoPapel.stockMinimo}).`,
        },
        include: { tipoPapel: true }
      });

      // Emitir evento en tiempo real
      try {
        const io = getIO();
        io.emit('nuevaAlerta', nuevaAlerta);
      } catch (e) {
        console.error('Socket.io no disponible para emitir alerta');
      }
      // Enviar correo a los administradores y supervisores
      try {
        // Obtener correos de admin/supervisor
        const usuariosParaAlertas = await tx.usuario.findMany({
          where: {
            rol: {
              nombre: { in: ['Admin', 'Supervisor'] }
            }
          },
          select: { email: true }
        });
        
        const correosDestino = usuariosParaAlertas.map((u: any) => u.email).filter(Boolean);
        
        // Enviar correo de forma asíncrona (sin bloquear la transacción)
        enviarAlertaStock(correosDestino, tipoPapel, stockTotal, tipoPapel.stocks).catch(err => {
          console.error('Fallo al enviar correo de alerta en background:', err);
        });
      } catch (err) {
        console.error('Error al preparar envío de correo:', err);
      }
    }
  }
};

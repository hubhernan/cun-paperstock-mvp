import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const registrarAuditoria = async (
  usuarioId: string,
  accion: string,
  entidad: string,
  entidadId?: string,
  detalles?: string,
  ip?: string
) => {
  try {
    await prisma.auditoriaAcciones.create({
      data: {
        usuarioId,
        accion,
        entidad,
        entidadId: entidadId || null,
        detalles: detalles || null,
        ip: ip || null
      }
    });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};

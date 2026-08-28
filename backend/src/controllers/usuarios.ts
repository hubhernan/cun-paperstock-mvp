import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

import { userLastSeenMap } from '../middleware/auth';

export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.id;

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
        turno: true,
        dispositivo: true,
        creadoEn: true,
        rol: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    const ahora = new Date().getTime();

    // Obtener la última actividad de cada usuario (Heartbeat en memoria + Bitácora de auditoría)
    const usuariosConPresencia = await Promise.all(
      usuarios.map(async (usr) => {
        const ultimaAuditoria = await prisma.auditoriaAcciones.findFirst({
          where: { usuarioId: usr.id },
          orderBy: { fecha: 'desc' },
          select: { fecha: true, accion: true }
        });

        const lastSeenDate = userLastSeenMap.get(usr.id);
        const lastSeenMs = lastSeenDate ? lastSeenDate.getTime() : 0;
        const auditMs = ultimaAuditoria ? new Date(ultimaAuditoria.fecha).getTime() : 0;

        let fechaUltimaActividad = lastSeenMs > auditMs ? lastSeenDate : (ultimaAuditoria ? ultimaAuditoria.fecha : null);
        let enLinea = false;

        // Reglas de Presencia en Tiempo Real:
        // 1. Si es el usuario actual que está realizando la consulta HTTP en este momento
        if (currentUserId && usr.id === currentUserId) {
          enLinea = true;
          fechaUltimaActividad = new Date();
          userLastSeenMap.set(usr.id, new Date());
        }
        // 2. Si el usuario ha realizado peticiones en los últimos 15 minutos
        else if (lastSeenMs > 0 && (ahora - lastSeenMs) < 15 * 60 * 1000) {
          enLinea = true;
        }
        // 3. Si tiene registro de inicio de sesión reciente y su última acción no fue LOGOUT
        else if (ultimaAuditoria && (ahora - auditMs) < 120 * 60 * 1000 && ultimaAuditoria.accion !== 'LOGOUT') {
          enLinea = true;
        }

        return {
          ...usr,
          ultimaActividad: fechaUltimaActividad,
          enLinea
        };
      })
    );

    res.json({ success: true, data: usuariosConPresencia });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.rol.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: roles });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ success: false, message: 'Error al obtener roles' });
  }
};

export const createUsuario = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rolNombre, turno, dispositivo } = req.body;
    const adminId = (req as any).user.id;

    if (!nombre || !email || !password || !rolNombre) {
      return res.status(400).json({ success: false, message: 'Nombre, email, password y rol son obligatorios' });
    }

    const emailExistente = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (emailExistente) {
      return res.status(400).json({ success: false, message: 'El correo electrónico ya se encuentra registrado' });
    }

    const rol = await prisma.rol.findUnique({
      where: { nombre: rolNombre }
    });

    if (!rol) {
      return res.status(404).json({ success: false, message: 'El rol especificado no existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        rolId: rol.id,
        turno: turno || 'Matutino',
        dispositivo: dispositivo || 'iPad',
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
        turno: true,
        dispositivo: true,
        rol: true
      }
    });

    // Auditoría
    await prisma.auditoriaAcciones.create({
      data: {
        usuarioId: adminId,
        accion: 'CREACION_USUARIO',
        entidad: 'Usuario',
        entidadId: nuevoUsuario.id,
        detalles: `Alta de usuario ${nuevoUsuario.nombre} (${nuevoUsuario.email}) con rol ${rol.nombre}`
      }
    });

    res.json({ success: true, data: nuevoUsuario, message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ success: false, message: 'Error al registrar el usuario' });
  }
};

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, newPassword, rolNombre, turno, dispositivo } = req.body;
    const adminId = (req as any).user.id;

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: id as string }
    });

    if (!usuarioExistente) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const dataToUpdate: any = {};
    if (nombre) dataToUpdate.nombre = nombre.trim();

    if (email && email.toLowerCase().trim() !== usuarioExistente.email) {
      const emailEnUso = await prisma.usuario.findUnique({
        where: { email: email.toLowerCase().trim() }
      });
      if (emailEnUso) {
        return res.status(400).json({ success: false, message: 'El correo electrónico / usuario ya se encuentra en uso' });
      }
      dataToUpdate.email = email.toLowerCase().trim();
    }

    const passToUpdate = password || newPassword;
    if (passToUpdate && passToUpdate.trim().length >= 4) {
      dataToUpdate.passwordHash = await bcrypt.hash(passToUpdate.trim(), 10);
    }

    if (turno !== undefined) dataToUpdate.turno = turno;
    if (dispositivo !== undefined) dataToUpdate.dispositivo = dispositivo;

    if (rolNombre) {
      const rol = await prisma.rol.findUnique({ where: { nombre: rolNombre } });
      if (rol) dataToUpdate.rolId = rol.id;
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: id as string },
      data: dataToUpdate,
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
        turno: true,
        dispositivo: true,
        rol: true
      }
    });

    // Auditoría
    await prisma.auditoriaAcciones.create({
      data: {
        usuarioId: adminId,
        accion: 'MODIFICACION_USUARIO',
        entidad: 'Usuario',
        entidadId: usuarioActualizado.id,
        detalles: `Edición de datos/derechos para ${usuarioActualizado.nombre} (${usuarioActualizado.email}, Rol: ${usuarioActualizado.rol.nombre})`
      }
    });

    res.json({ success: true, data: usuarioActualizado, message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el usuario' });
  }
};

export const toggleUsuarioActivo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;

    if (id === adminId) {
      return res.status(400).json({ success: false, message: 'No puedes dar de baja a tu propia cuenta con la que iniciaste sesión' });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: id as string }
    });

    if (!usuarioExistente) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const nuevoEstado = !usuarioExistente.activo;

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: id as string },
      data: { activo: nuevoEstado },
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
        rol: true
      }
    });

    // Auditoría
    await prisma.auditoriaAcciones.create({
      data: {
        usuarioId: adminId,
        accion: 'CAMBIO_ESTADO_USUARIO',
        entidad: 'Usuario',
        entidadId: usuarioActualizado.id,
        detalles: `${nuevoEstado ? 'ALTA / ACTIVACIÓN' : 'BAJA / DESACTIVACIÓN'} de usuario ${usuarioActualizado.nombre} (${usuarioActualizado.email})`
      }
    });

    res.json({
      success: true,
      data: usuarioActualizado,
      message: `Usuario ${nuevoEstado ? 'activado (Dado de Alta)' : 'desactivado (Dado de Baja)'} exitosamente`
    });
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar estado del usuario' });
  }
};

export const resetUsuarioPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const adminId = (req as any).user.id;

    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 4 caracteres' });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: id as string }
    });

    if (!usuarioExistente) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.usuario.update({
      where: { id: id as string },
      data: { passwordHash }
    });

    // Auditoría
    await prisma.auditoriaAcciones.create({
      data: {
        usuarioId: adminId,
        accion: 'RESETEO_PASSWORD_USUARIO',
        entidad: 'Usuario',
        entidadId: id as string,
        detalles: `Contraseña restablecida para usuario ${usuarioExistente.nombre} (${usuarioExistente.email})`
      }
    });

    res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ success: false, message: 'Error al restablecer la contraseña' });
  }
};

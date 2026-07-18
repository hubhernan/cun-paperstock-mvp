import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'No se proporcionó token' });

  jwt.verify(token, process.env.JWT_SECRET || 'super-secret-cun-key-change-me', async (err: any, decoded: any) => {
    if (err) return res.status(403).json({ success: false, message: 'Token inválido o expirado' });

    try {
      const user = await prisma.usuario.findUnique({
        where: { id: decoded.userId },
        include: { rol: true }
      });
      if (!user || !user.activo) {
        return res.status(403).json({ success: false, message: 'Usuario no encontrado o inactivo' });
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error de servidor' });
    }
  });
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol.nombre)) {
      return res.status(403).json({ success: false, message: 'No tienes permisos suficientes' });
    }
    next();
  };
};

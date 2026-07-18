"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ success: false, message: 'No se proporcionó token' });
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'super-secret-cun-key-change-me', async (err, decoded) => {
        if (err)
            return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
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
        }
        catch (error) {
            return res.status(500).json({ success: false, message: 'Error de servidor' });
        }
    });
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.rol.nombre)) {
            return res.status(403).json({ success: false, message: 'No tienes permisos suficientes' });
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map
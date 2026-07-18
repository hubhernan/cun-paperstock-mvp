"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auditoria_1 = require("../utils/auditoria");
const prisma = new client_1.PrismaClient();
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { email },
            include: { rol: true }
        });
        if (!usuario || !usuario.activo) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas o usuario inactivo' });
        }
        const validPassword = await bcryptjs_1.default.compare(password, usuario.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
        const token = jsonwebtoken_1.default.sign({ id: usuario.id, email: usuario.email, rol: usuario.rol.nombre }, process.env.JWT_SECRET || 'secret_dev', { expiresIn: '8h' });
        // Registro de auditoría
        await (0, auditoria_1.registrarAuditoria)(usuario.id, 'LOGIN', 'Usuario', usuario.id, 'Inicio de sesión exitoso', req.ip);
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.rol.nombre
                }
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};
exports.login = login;
//# sourceMappingURL=auth.js.map
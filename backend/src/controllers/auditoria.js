"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditoria = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAuditoria = async (req, res) => {
    try {
        const logs = await prisma.auditoriaAcciones.findMany({
            include: {
                usuario: { select: { nombre: true, email: true } }
            },
            orderBy: { fecha: 'desc' },
            take: 100
        });
        res.json({ success: true, data: logs });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener auditoría' });
    }
};
exports.getAuditoria = getAuditoria;
//# sourceMappingURL=auditoria.js.map
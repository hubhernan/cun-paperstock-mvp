"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarAuditoria = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const registrarAuditoria = async (usuarioId, accion, entidad, entidadId, detalles, ip) => {
    try {
        await prisma.auditoriaAcciones.create({
            data: {
                usuarioId,
                accion,
                entidad,
                entidadId,
                detalles,
                ip
            }
        });
    }
    catch (error) {
        console.error('Error al registrar auditoría:', error);
    }
};
exports.registrarAuditoria = registrarAuditoria;
//# sourceMappingURL=auditoria.js.map
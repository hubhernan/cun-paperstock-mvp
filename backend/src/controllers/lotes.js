"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLote = exports.getAllLotes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllLotes = async (req, res) => {
    try {
        const lotes = await prisma.lote.findMany({
            include: { tipoPapel: true }
        });
        res.json({ success: true, data: lotes });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener lotes' });
    }
};
exports.getAllLotes = getAllLotes;
const createLote = async (req, res) => {
    try {
        const data = req.body;
        const nuevoLote = await prisma.lote.create({
            data: {
                tipoPapelId: data.tipoPapelId,
                numeroLote: data.numeroLote,
                fechaRecepcion: data.fechaRecepcion ? new Date(data.fechaRecepcion) : new Date(),
                fechaCaducidad: data.fechaCaducidad ? new Date(data.fechaCaducidad) : null,
            }
        });
        res.json({ success: true, data: nuevoLote, message: 'Lote registrado exitosamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al registrar lote' });
    }
};
exports.createLote = createLote;
//# sourceMappingURL=lotes.js.map
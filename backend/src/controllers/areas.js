"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArea = exports.getAllAreas = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllAreas = async (req, res) => {
    try {
        const areas = await prisma.areaAeropuerto.findMany({
            include: {
                perifericos: true,
            }
        });
        res.json({ success: true, data: areas });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener áreas' });
    }
};
exports.getAllAreas = getAllAreas;
const createArea = async (req, res) => {
    try {
        const data = req.body;
        const nuevaArea = await prisma.areaAeropuerto.create({
            data: {
                nombre: data.nombre,
                terminal: data.terminal,
                zona: data.zona,
            }
        });
        res.json({ success: true, data: nuevaArea, message: 'Área creada exitosamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al crear área' });
    }
};
exports.createArea = createArea;
//# sourceMappingURL=areas.js.map
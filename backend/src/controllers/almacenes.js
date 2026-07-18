"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockAlmacen = exports.createAlmacen = exports.getAllAlmacenes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllAlmacenes = async (req, res) => {
    try {
        const almacenes = await prisma.almacen.findMany();
        res.json({ success: true, data: almacenes });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener almacenes' });
    }
};
exports.getAllAlmacenes = getAllAlmacenes;
const createAlmacen = async (req, res) => {
    try {
        const data = req.body;
        const nuevoAlmacen = await prisma.almacen.create({
            data: {
                nombre: data.nombre,
                ubicacion: data.ubicacion,
                capacidad: data.capacidad,
                responsableId: data.responsableId
            }
        });
        res.json({ success: true, data: nuevoAlmacen, message: 'Almacén creado exitosamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al crear almacén' });
    }
};
exports.createAlmacen = createAlmacen;
const getStockAlmacen = async (req, res) => {
    try {
        const { id } = req.params;
        const stock = await prisma.stockAlmacen.findMany({
            where: { almacenId: id },
            include: {
                tipoPapel: true
            }
        });
        res.json({ success: true, data: stock });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener stock del almacén' });
    }
};
exports.getStockAlmacen = getStockAlmacen;
//# sourceMappingURL=almacenes.js.map
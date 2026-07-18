"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTipoPapel = exports.getAllTiposPapel = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllTiposPapel = async (req, res) => {
    try {
        const tipos = await prisma.tipoPapel.findMany();
        res.json({ success: true, data: tipos });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener tipos de papel' });
    }
};
exports.getAllTiposPapel = getAllTiposPapel;
const createTipoPapel = async (req, res) => {
    try {
        const data = req.body;
        const nuevoTipo = await prisma.tipoPapel.create({
            data: {
                codigo: data.codigo,
                descripcion: data.descripcion,
                dimensiones: data.dimensiones,
                gramaje: data.gramaje,
                material: data.material,
                proveedor: data.proveedor,
                unidadMedida: data.unidadMedida,
                costoUnitario: data.costoUnitario,
                stockMinimo: data.stockMinimo,
                stockMaximo: data.stockMaximo,
                puntoReorden: data.puntoReorden,
            }
        });
        res.json({ success: true, data: nuevoTipo, message: 'Tipo de papel creado exitosamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al crear tipo de papel' });
    }
};
exports.createTipoPapel = createTipoPapel;
//# sourceMappingURL=tipos-papel.js.map
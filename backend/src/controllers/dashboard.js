"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKPIs = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getKPIs = async (req, res) => {
    try {
        // 1. Total tipos de papel
        const totalTiposPapel = await prisma.tipoPapel.count();
        // 2. Stock Total (Unidades)
        const stockAgrupado = await prisma.stockAlmacen.aggregate({
            _sum: { cantidadActual: true }
        });
        const stockTotal = stockAgrupado._sum.cantidadActual || 0;
        // 3. Consumo Hoy (Salidas, Mermas o Asignaciones de hoy)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const salidasHoy = await prisma.movimientoInventario.aggregate({
            where: {
                tipoMovimiento: { in: ['SALIDA', 'MERMA'] },
                fechaMovimiento: { gte: hoy }
            },
            _sum: { cantidad: true }
        });
        const consumoHoy = salidasHoy._sum.cantidad || 0;
        // 4. Alertas de Stock (Tipos de papel cuyo stock global es menor al mínimo)
        // Para simplificar: buscar qué tipos de papel tienen su stock total (suma de todos los almacenes) por debajo del stockMinimo
        const stockPorPapel = await prisma.stockAlmacen.groupBy({
            by: ['tipoPapelId'],
            _sum: { cantidadActual: true }
        });
        const tiposPapel = await prisma.tipoPapel.findMany();
        let alertasStock = 0;
        tiposPapel.forEach(tp => {
            const stock = stockPorPapel.find(s => s.tipoPapelId === tp.id)?._sum.cantidadActual || 0;
            if (stock <= tp.stockMinimo) {
                alertasStock++;
            }
        });
        res.json({
            success: true,
            data: {
                totalTiposPapel,
                stockTotal,
                consumoHoy,
                alertasStock
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener KPIs' });
    }
};
exports.getKPIs = getKPIs;
//# sourceMappingURL=dashboard.js.map
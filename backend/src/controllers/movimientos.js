"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarMovimiento = exports.getMovimientos = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const socket_1 = require("../socket");
const prisma = new client_1.PrismaClient();
const getMovimientos = async (req, res) => {
    try {
        const movimientos = await prisma.movimientoInventario.findMany({
            include: {
                tipoPapel: true,
                almacenOrigen: true,
                almacenDestino: true,
                usuario: { select: { nombre: true, email: true } }
            },
            orderBy: { fechaMovimiento: 'desc' },
            take: 50 // Limitando a los últimos 50 para el dashboard/historial
        });
        res.json({ success: true, data: movimientos });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener movimientos' });
    }
};
exports.getMovimientos = getMovimientos;
const registrarMovimiento = async (req, res) => {
    const { tipoPapelId, loteId, almacenOrigenId, almacenDestinoId, tipoMovimiento, cantidad, comentarios } = req.body;
    const usuarioId = req.user.id;
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Crear el registro del movimiento
            const movimiento = await tx.movimientoInventario.create({
                data: {
                    tipoPapelId,
                    loteId,
                    almacenOrigenId,
                    almacenDestinoId,
                    tipoMovimiento,
                    cantidad: Number(cantidad),
                    usuarioId,
                    comentarios
                }
            });
            // 2. Actualizar stock basado en el tipo de movimiento
            if (tipoMovimiento === 'ENTRADA') {
                if (!almacenDestinoId)
                    throw new Error('ENTRADA requiere almacenDestinoId');
                await updateStock(tx, almacenDestinoId, tipoPapelId, Number(cantidad));
            }
            else if (tipoMovimiento === 'SALIDA' || tipoMovimiento === 'MERMA') {
                if (!almacenOrigenId)
                    throw new Error(`${tipoMovimiento} requiere almacenOrigenId`);
                await updateStock(tx, almacenOrigenId, tipoPapelId, -Number(cantidad));
            }
            else if (tipoMovimiento === 'TRANSFERENCIA') {
                if (!almacenOrigenId || !almacenDestinoId)
                    throw new Error('TRANSFERENCIA requiere origen y destino');
                await updateStock(tx, almacenOrigenId, tipoPapelId, -Number(cantidad));
                await updateStock(tx, almacenDestinoId, tipoPapelId, Number(cantidad));
            }
            return movimiento;
        });
        res.json({ success: true, data: result, message: 'Movimiento registrado exitosamente' });
        // Emitir evento WebSocket para actualizar en tiempo real
        try {
            const io = (0, socket_1.getIO)();
            io.emit('stockUpdate', { action: 'MOVIMIENTO', tipoMovimiento, data: result });
        }
        catch (err) {
            console.error('WebSocket no disponible', err);
        }
    }
    catch (error) {
        console.error('Error en transacción:', error);
        res.status(400).json({ success: false, message: error.message || 'Error al registrar movimiento' });
    }
};
exports.registrarMovimiento = registrarMovimiento;
// Función auxiliar para actualizar o crear registro de stock
async function updateStock(tx, almacenId, tipoPapelId, delta) {
    const stockRecord = await tx.stockAlmacen.findUnique({
        where: {
            almacenId_tipoPapelId: { almacenId, tipoPapelId }
        }
    });
    if (stockRecord) {
        if (stockRecord.cantidadActual + delta < 0) {
            throw new Error(`Stock insuficiente en el almacén para el tipo de papel`);
        }
        await tx.stockAlmacen.update({
            where: { id: stockRecord.id },
            data: { cantidadActual: stockRecord.cantidadActual + delta }
        });
    }
    else {
        if (delta < 0) {
            throw new Error(`Stock insuficiente (no existe registro en almacén)`);
        }
        await tx.stockAlmacen.create({
            data: {
                almacenId,
                tipoPapelId,
                cantidadActual: delta
            }
        });
    }
}
//# sourceMappingURL=movimientos.js.map
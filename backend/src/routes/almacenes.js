"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const almacenes_1 = require("../controllers/almacenes");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, almacenes_1.getAllAlmacenes);
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin', 'Supervisor']), almacenes_1.createAlmacen);
router.get('/:id/stock', auth_1.authenticateToken, almacenes_1.getStockAlmacen);
exports.default = router;
//# sourceMappingURL=almacenes.js.map
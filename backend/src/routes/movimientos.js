"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const movimientos_1 = require("../controllers/movimientos");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, movimientos_1.getMovimientos);
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin', 'Supervisor', 'Operador']), movimientos_1.registrarMovimiento);
exports.default = router;
//# sourceMappingURL=movimientos.js.map
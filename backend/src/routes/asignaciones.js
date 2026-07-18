"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asignaciones_1 = require("../controllers/asignaciones");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, asignaciones_1.getAsignaciones);
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin', 'Supervisor', 'Operador']), asignaciones_1.registrarAsignacion);
exports.default = router;
//# sourceMappingURL=asignaciones.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tipos_papel_1 = require("../controllers/tipos-papel");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todos los usuarios autenticados pueden ver el catálogo
router.get('/', auth_1.authenticateToken, tipos_papel_1.getAllTiposPapel);
// Solo Admin y Supervisor pueden crear tipos de papel
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin', 'Supervisor']), tipos_papel_1.createTipoPapel);
exports.default = router;
//# sourceMappingURL=tipos-papel.js.map
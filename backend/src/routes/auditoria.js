"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditoria_1 = require("../controllers/auditoria");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Solo Administradores pueden ver la auditoría
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin']), auditoria_1.getAuditoria);
exports.default = router;
//# sourceMappingURL=auditoria.js.map
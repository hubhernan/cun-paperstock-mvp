"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lotes_1 = require("../controllers/lotes");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, lotes_1.getAllLotes);
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin', 'Supervisor', 'Operador']), lotes_1.createLote);
exports.default = router;
//# sourceMappingURL=lotes.js.map
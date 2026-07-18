"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const perifericos_1 = require("../controllers/perifericos");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, perifericos_1.getAllPerifericos);
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin', 'Supervisor']), perifericos_1.createPeriferico);
exports.default = router;
//# sourceMappingURL=perifericos.js.map
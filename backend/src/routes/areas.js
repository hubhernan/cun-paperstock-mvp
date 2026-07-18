"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const areas_1 = require("../controllers/areas");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, areas_1.getAllAreas);
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin', 'Supervisor']), areas_1.createArea);
exports.default = router;
//# sourceMappingURL=areas.js.map
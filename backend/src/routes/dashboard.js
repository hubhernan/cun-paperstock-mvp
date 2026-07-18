"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_1 = require("../controllers/dashboard");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/kpis', auth_1.authenticateToken, dashboard_1.getKPIs);
exports.default = router;
//# sourceMappingURL=dashboard.js.map
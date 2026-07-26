import { Router } from 'express';
import { getKPIs, getChartData } from '../controllers/dashboard';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/kpis', authenticateToken, getKPIs);
router.get('/charts', authenticateToken, getChartData);

export default router;

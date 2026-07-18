import { Router } from 'express';
import { getKPIs } from '../controllers/dashboard';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/kpis', authenticateToken, getKPIs);

export default router;

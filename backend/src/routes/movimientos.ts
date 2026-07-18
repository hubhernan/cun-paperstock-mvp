import { Router } from 'express';
import { getMovimientos, registrarMovimiento } from '../controllers/movimientos';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getMovimientos);
router.post('/', authenticateToken, requireRole(['Admin', 'Supervisor', 'Operador']), registrarMovimiento);

export default router;

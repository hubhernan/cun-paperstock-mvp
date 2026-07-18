import { Router } from 'express';
import { getAllLotes, createLote } from '../controllers/lotes';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAllLotes);
router.post('/', authenticateToken, requireRole(['Admin', 'Supervisor', 'Operador']), createLote);

export default router;

import { Router } from 'express';
import { getAllLotes, createLote, getHistorialLote } from '../controllers/lotes';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAllLotes);
router.get('/:id/historial', authenticateToken, getHistorialLote);
router.post('/', authenticateToken, requireRole(['Admin', 'Supervisor', 'Operador']), createLote);

export default router;

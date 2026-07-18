import { Router } from 'express';
import { getAsignaciones, registrarAsignacion } from '../controllers/asignaciones';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAsignaciones);
router.post('/', authenticateToken, requireRole(['Admin', 'Supervisor', 'Operador']), registrarAsignacion);

export default router;

import { Router } from 'express';
import { getAllTiposPapel, createTipoPapel } from '../controllers/tipos-papel';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Todos los usuarios autenticados pueden ver el catálogo
router.get('/', authenticateToken, getAllTiposPapel);

// Solo Admin y Supervisor pueden crear tipos de papel
router.post('/', authenticateToken, requireRole(['Admin', 'Supervisor']), createTipoPapel);

export default router;

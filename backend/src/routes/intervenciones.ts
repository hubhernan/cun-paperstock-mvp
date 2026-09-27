import { Router } from 'express';
import { createIntervencion, revertirIntervencion } from '../controllers/intervenciones';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createIntervencion);
router.post('/:id/revertir', authenticateToken, revertirIntervencion);

export default router;

import { Router } from 'express';
import { getAllPerifericos, createPeriferico, updateNivelPeriferico } from '../controllers/perifericos';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAllPerifericos);
router.post('/', authenticateToken, requireRole(['Admin', 'Supervisor']), createPeriferico);
router.patch('/:id/nivel', authenticateToken, updateNivelPeriferico);

export default router;

import { Router } from 'express';
import { getAllAreas, createArea } from '../controllers/areas';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAllAreas);
router.post('/', authenticateToken, requireRole(['Admin', 'Supervisor']), createArea);

export default router;

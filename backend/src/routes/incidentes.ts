import { Router } from 'express';
import { getAllIncidentes, createIncidente, updateIncidenteStatus } from '../controllers/incidentes';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAllIncidentes);
router.post('/', authenticateToken, createIncidente);
router.patch('/:id/estado', authenticateToken, requireRole(['Admin', 'Supervisor']), updateIncidenteStatus);

export default router;

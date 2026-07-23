import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  getAlertas,
  marcarAlertaLeida,
  marcarTodasLeidas
} from '../controllers/alertas';

const router = Router();

// Todas las rutas de alertas están protegidas y restringidas a Admin y Supervisor
router.use(authenticateToken);
router.use(requireRole(['Admin', 'Supervisor']));

router.get('/', getAlertas);
router.put('/todas-leidas', marcarTodasLeidas);
router.put('/:id/leer', marcarAlertaLeida);

export default router;

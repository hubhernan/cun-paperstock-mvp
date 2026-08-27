import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAlertas,
  marcarAlertaLeida,
  marcarTodasLeidas
} from '../controllers/alertas';

const router = Router();

// Todas las rutas de alertas requieren autenticación (accesibles para todos los roles)
router.use(authenticateToken);

router.get('/', getAlertas);
router.put('/todas-leidas', marcarTodasLeidas);
router.put('/:id/leer', marcarAlertaLeida);

export default router;

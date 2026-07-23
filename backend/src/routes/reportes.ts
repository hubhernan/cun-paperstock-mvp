import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  getReporteMovimientos,
  getReporteStockValor,
  getReporteConsumoArea,
  getReporteConsumoAlmacen
} from '../controllers/reportes';

const router = Router();

// Todas las rutas de reportes están protegidas y restringidas a Admin y Supervisor
router.use(authenticateToken);
router.use(requireRole(['Admin', 'Supervisor']));

router.get('/movimientos', getReporteMovimientos);
router.get('/valor-stock', getReporteStockValor);
router.get('/consumo-area', getReporteConsumoArea);
router.get('/consumo-almacen', getReporteConsumoAlmacen);

export default router;

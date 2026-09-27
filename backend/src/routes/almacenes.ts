import { Router } from 'express';
import { getAllAlmacenes, createAlmacen, getStockAlmacen, verificarStockAlmacen, getVerificacionesStock } from '../controllers/almacenes';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAllAlmacenes);
router.post('/', authenticateToken, requireRole(['Admin', 'Supervisor']), createAlmacen);
router.get('/verificaciones-ok', authenticateToken, getVerificacionesStock);
router.get('/:id/stock', authenticateToken, getStockAlmacen);
router.post('/verificar-stock', authenticateToken, verificarStockAlmacen);

export default router;

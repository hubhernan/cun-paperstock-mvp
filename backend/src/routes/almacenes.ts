import { Router } from 'express';
import { getAllAlmacenes, createAlmacen, getStockAlmacen, verificarStockAlmacen } from '../controllers/almacenes';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAllAlmacenes);
router.post('/', authenticateToken, requireRole(['Admin', 'Supervisor']), createAlmacen);
router.get('/:id/stock', authenticateToken, getStockAlmacen);
router.post('/verificar-stock', authenticateToken, verificarStockAlmacen);

export default router;

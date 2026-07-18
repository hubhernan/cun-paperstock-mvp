import { Router } from 'express';
import { getAllAlmacenes, createAlmacen, getStockAlmacen } from '../controllers/almacenes';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAllAlmacenes);
router.post('/', authenticateToken, requireRole(['Admin', 'Supervisor']), createAlmacen);
router.get('/:id/stock', authenticateToken, getStockAlmacen);

export default router;

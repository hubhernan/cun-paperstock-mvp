import { Router } from 'express';
import { getUsuarios } from '../controllers/usuarios';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole(['Admin']), getUsuarios);

export default router;

import { Router } from 'express';
import { getAuditoria } from '../controllers/auditoria';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Solo Administradores pueden ver la auditoría
router.get('/', authenticateToken, requireRole(['Admin']), getAuditoria);

export default router;

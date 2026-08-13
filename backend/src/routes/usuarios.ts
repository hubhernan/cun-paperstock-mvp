import { Router } from 'express';
import { 
  getUsuarios, 
  getRoles, 
  createUsuario, 
  updateUsuario, 
  toggleUsuarioActivo, 
  resetUsuarioPassword 
} from '../controllers/usuarios';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireRole(['Admin']), getUsuarios);
router.get('/roles', authenticateToken, requireRole(['Admin']), getRoles);
router.post('/', authenticateToken, requireRole(['Admin']), createUsuario);
router.put('/:id', authenticateToken, requireRole(['Admin']), updateUsuario);
router.patch('/:id/toggle-activo', authenticateToken, requireRole(['Admin']), toggleUsuarioActivo);
router.patch('/:id/reset-password', authenticateToken, requireRole(['Admin']), resetUsuarioPassword);

export default router;

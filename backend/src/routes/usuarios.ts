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

// Lectura de lista de usuarios y roles permitida para Admin, Supervisor y Operador
router.get('/', authenticateToken, requireRole(['Admin', 'Supervisor', 'Operador']), getUsuarios);
router.get('/roles', authenticateToken, requireRole(['Admin', 'Supervisor', 'Operador']), getRoles);

// Modificaciones, alta, edición de roles y passwords restringidos a Admin y Supervisor
router.post('/', authenticateToken, requireRole(['Admin', 'Supervisor']), createUsuario);
router.put('/:id', authenticateToken, requireRole(['Admin', 'Supervisor']), updateUsuario);
router.patch('/:id/toggle-activo', authenticateToken, requireRole(['Admin', 'Supervisor']), toggleUsuarioActivo);
router.patch('/:id/reset-password', authenticateToken, requireRole(['Admin', 'Supervisor']), resetUsuarioPassword);

export default router;

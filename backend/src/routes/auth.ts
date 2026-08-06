import { Router } from 'express';
import { login, logout } from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/logout', authenticateToken, logout);

export default router;

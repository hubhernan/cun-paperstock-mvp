import { Router } from 'express';
import { createIntervencion } from '../controllers/intervenciones';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createIntervencion);

export default router;

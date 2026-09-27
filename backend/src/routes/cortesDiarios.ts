import { Router } from 'express';
import { 
  getUltimos3CortesDiarios, 
  getCortesDiariosReporte, 
  ejecutarCorteDiarioManual 
} from '../controllers/cortesDiarios';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/ultimos3', getUltimos3CortesDiarios);
router.get('/reporte', getCortesDiariosReporte);
router.post('/generar', authenticateToken, ejecutarCorteDiarioManual);

export default router;

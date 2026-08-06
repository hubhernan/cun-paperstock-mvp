import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import authRoutes from './routes/auth';
import tiposPapelRoutes from './routes/tipos-papel';
import almacenesRoutes from './routes/almacenes';
import lotesRoutes from './routes/lotes';
import areasRoutes from './routes/areas';
import perifericosRoutes from './routes/perifericos';
import movimientosRoutes from './routes/movimientos';
import asignacionesRoutes from './routes/asignaciones';
import dashboardRoutes from './routes/dashboard';
import auditoriaRoutes from './routes/auditoria';
import reportesRoutes from './routes/reportes';
import incidentesRoutes from './routes/incidentes';
import alertasRoutes from './routes/alertas';
import usuariosRoutes from './routes/usuarios';
import intervencionesRoutes from './routes/intervenciones';
import { startAlertService } from './services/AlertService';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tipos-papel', tiposPapelRoutes);
app.use('/api/almacenes', almacenesRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/perifericos', perifericosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/asignaciones', asignacionesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/incidentes', incidentesRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/intervenciones', intervencionesRoutes);

// Servir el frontend en producción (archivos estáticos)
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

const server = createServer(app);
// Iniciar servicio automático de alertas (Fase 4)
startAlertService();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

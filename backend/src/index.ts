import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { initSocket } from './socket';
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

const server = createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

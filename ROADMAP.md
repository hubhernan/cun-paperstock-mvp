# SITAINventarioAeropuerto - Roadmap y Estado del Proyecto

## Estado Actual (Al cierre de la Fase 5)
El proyecto cuenta con un MVP (Minimum Viable Product) funcional y desplegado en producción para su evaluación.

**Infraestructura:**
- **Base de Datos:** PostgreSQL alojada en Neon / Supabase.
- **Backend:** API REST con Node.js, Express y Prisma, alojado en Render.
- **Frontend:** React + Vite, alojado en Vercel.

**Módulos Completados (Fases 1 a 5):**
1. **Autenticación y Usuarios:** Login seguro con JWT y gestión de roles (Admin, Supervisor, Operador, Ejecutivo).
2. **Catálogo de Papel:** Gestión (CRUD) de Tipos de Papel (Bag Tags, Boarding Passes, etc.).
3. **Almacenes y Áreas:** Gestión de múltiples almacenes, áreas del aeropuerto (T2, T3) y periféricos (impresoras asociadas a las áreas).
4. **Movimientos de Inventario:** Registro de Entradas, Salidas y Transferencias con afectación en tiempo real al Stock.
5. **Dashboard Básico y Auditoría:** Vista general con KPIs (Tipos de Papel, Stock Total, Consumo Hoy, Alertas) y registro de auditoría de acciones de usuarios. Actualizaciones en tiempo real vía Socket.io.

---

## Siguientes Pasos (Fase 6)
De acuerdo a lo acordado, el desarrollo se encuentra pausado para recibir feedback de los usuarios. Una vez recolectado el feedback, el desarrollo continuará enfocándose en los siguientes 4 puntos clave:

1. **Módulo de Reportes Avanzados:** 
   - Generación automática y exportación de reportes en formatos PDF o Excel.
   - Posibles métricas: consumo mensual por aerolínea/terminal, valor del stock actual, historial de movimientos detallado.
2. **Alertas Inteligentes (Notificaciones):**
   - Configuración de alertas automáticas (por correo electrónico o panel) cuando el stock de un insumo caiga por debajo de su `stockMinimo`.
3. **Escaneo de Códigos (Lector de Barras / QR):**
   - Adaptación de la interfaz de "Movimientos" para integrarse con pistolas lectoras de códigos de barras.
   - Automatización de registro de entradas/salidas al escanear, minimizando la captura manual.
4. **Dashboard Avanzado:**
   - Incorporación de gráficas visuales (barras, líneas, pastel) para analizar tendencias.
   - Visualización del consumo histórico de los últimos 7, 30 o 90 días.

## Notas para el Agente (Contexto Futuro)
- El entorno de producción usa variables de entorno (`VITE_API_URL` para el frontend y `DATABASE_URL` / `JWT_SECRET` para el backend).
- Al retomar el proyecto, revisar los tickets o feedback provistos por el usuario y comenzar con la planeación (Implementation Plan) de los puntos de la Fase 6.

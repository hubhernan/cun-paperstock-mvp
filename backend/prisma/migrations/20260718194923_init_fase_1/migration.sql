-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_papel" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "dimensiones" TEXT NOT NULL,
    "gramaje" TEXT,
    "material" TEXT,
    "proveedor" TEXT,
    "unidad_medida" TEXT NOT NULL,
    "costo_unitario" DECIMAL(10,2) NOT NULL,
    "stock_minimo" INTEGER NOT NULL,
    "stock_maximo" INTEGER NOT NULL,
    "punto_reorden" INTEGER NOT NULL,

    CONSTRAINT "tipos_papel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "tipo_papel_id" TEXT NOT NULL,
    "numero_lote" TEXT NOT NULL,
    "fecha_recepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_caducidad" TIMESTAMP(3),

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "almacenes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "capacidad" TEXT,
    "responsable_id" TEXT,

    CONSTRAINT "almacenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_almacen" (
    "id" TEXT NOT NULL,
    "almacen_id" TEXT NOT NULL,
    "tipo_papel_id" TEXT NOT NULL,
    "cantidad_actual" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stock_almacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_aeropuerto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "terminal" TEXT NOT NULL,
    "zona" TEXT,

    CONSTRAINT "areas_aeropuerto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "tipo_papel_id" TEXT NOT NULL,
    "lote_id" TEXT,
    "almacen_origen_id" TEXT,
    "almacen_destino_id" TEXT,
    "tipo_movimiento" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comentarios" TEXT,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_periferico" (
    "id" TEXT NOT NULL,
    "periferico_id" TEXT NOT NULL,
    "tipo_papel_id" TEXT NOT NULL,
    "lote_id" TEXT,
    "cantidad_asignada" INTEGER NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaciones_periferico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_acciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "detalles" TEXT,
    "ip" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_acciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_papel_codigo_key" ON "tipos_papel"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_tipo_papel_id_numero_lote_key" ON "lotes"("tipo_papel_id", "numero_lote");

-- CreateIndex
CREATE UNIQUE INDEX "stock_almacen_almacen_id_tipo_papel_id_key" ON "stock_almacen"("almacen_id", "tipo_papel_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_tipo_papel_id_fkey" FOREIGN KEY ("tipo_papel_id") REFERENCES "tipos_papel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_almacen" ADD CONSTRAINT "stock_almacen_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_almacen" ADD CONSTRAINT "stock_almacen_tipo_papel_id_fkey" FOREIGN KEY ("tipo_papel_id") REFERENCES "tipos_papel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_tipo_papel_id_fkey" FOREIGN KEY ("tipo_papel_id") REFERENCES "tipos_papel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_almacen_origen_id_fkey" FOREIGN KEY ("almacen_origen_id") REFERENCES "almacenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_almacen_destino_id_fkey" FOREIGN KEY ("almacen_destino_id") REFERENCES "almacenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_periferico" ADD CONSTRAINT "asignaciones_periferico_tipo_papel_id_fkey" FOREIGN KEY ("tipo_papel_id") REFERENCES "tipos_papel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_periferico" ADD CONSTRAINT "asignaciones_periferico_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_periferico" ADD CONSTRAINT "asignaciones_periferico_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_acciones" ADD CONSTRAINT "auditoria_acciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "stock_almacen_almacen_id_tipo_papel_id_key";

-- AlterTable
ALTER TABLE "almacenes" ADD COLUMN     "proveedor" TEXT DEFAULT 'ASUR';

-- AlterTable
ALTER TABLE "perifericos" ADD COLUMN     "estado_conexion" TEXT NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "impresiones_diarias" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nivel_papel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimo_consumo" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "stock_almacen" ADD COLUMN     "lote_id" TEXT;

-- AlterTable
ALTER TABLE "tipos_papel" ADD COLUMN     "rendimiento_estimado" INTEGER;

-- CreateTable
CREATE TABLE "alertas_stock" (
    "id" TEXT NOT NULL,
    "tipo_papel_id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_telemetria" (
    "id" TEXT NOT NULL,
    "periferico_id" TEXT NOT NULL,
    "nivel_papel" INTEGER NOT NULL,
    "estado_conexion" TEXT NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_telemetria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cortes_diarios" (
    "id" TEXT NOT NULL,
    "fecha_corte" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_atb" INTEGER NOT NULL DEFAULT 0,
    "total_btp" INTEGER NOT NULL DEFAULT 0,
    "diferencias" TEXT,
    "creado_por" TEXT,

    CONSTRAINT "cortes_diarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidentes_discrepancias" (
    "id" TEXT NOT NULL,
    "terminal" TEXT NOT NULL,
    "ingeniero_id" TEXT NOT NULL,
    "stock_calculado" INTEGER NOT NULL,
    "stock_fisico" INTEGER NOT NULL,
    "diferencia" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "fecha_incidente" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comentarios" TEXT,

    CONSTRAINT "incidentes_discrepancias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stock_almacen" ADD CONSTRAINT "stock_almacen_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_stock" ADD CONSTRAINT "alertas_stock_tipo_papel_id_fkey" FOREIGN KEY ("tipo_papel_id") REFERENCES "tipos_papel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_telemetria" ADD CONSTRAINT "registros_telemetria_periferico_id_fkey" FOREIGN KEY ("periferico_id") REFERENCES "perifericos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidentes_discrepancias" ADD CONSTRAINT "incidentes_discrepancias_ingeniero_id_fkey" FOREIGN KEY ("ingeniero_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

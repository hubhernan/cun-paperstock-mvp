-- CreateTable
CREATE TABLE "perifericos" (
    "id" TEXT NOT NULL,
    "identificador_unico" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "estado_operativo" TEXT NOT NULL,

    CONSTRAINT "perifericos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perifericos_tipos_papel_compatibles" (
    "periferico_id" TEXT NOT NULL,
    "tipo_papel_id" TEXT NOT NULL,

    CONSTRAINT "perifericos_tipos_papel_compatibles_pkey" PRIMARY KEY ("periferico_id","tipo_papel_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perifericos_identificador_unico_key" ON "perifericos"("identificador_unico");

-- AddForeignKey
ALTER TABLE "perifericos" ADD CONSTRAINT "perifericos_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_aeropuerto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perifericos_tipos_papel_compatibles" ADD CONSTRAINT "perifericos_tipos_papel_compatibles_periferico_id_fkey" FOREIGN KEY ("periferico_id") REFERENCES "perifericos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perifericos_tipos_papel_compatibles" ADD CONSTRAINT "perifericos_tipos_papel_compatibles_tipo_papel_id_fkey" FOREIGN KEY ("tipo_papel_id") REFERENCES "tipos_papel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_periferico" ADD CONSTRAINT "asignaciones_periferico_periferico_id_fkey" FOREIGN KEY ("periferico_id") REFERENCES "perifericos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

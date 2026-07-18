import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de Fase 3...');

  // Obtener IDs base
  const admin = await prisma.usuario.findFirst({ where: { email: 'admin@cun.mx' } });
  const tipoPapelBT = await prisma.tipoPapel.findFirst({ where: { codigo: 'BT-001' } });
  const tipoPapelBP = await prisma.tipoPapel.findFirst({ where: { codigo: 'BP-001' } });
  let almacen = await prisma.almacen.findFirst();
  if (!almacen) {
    almacen = await prisma.almacen.create({
      data: {
        nombre: 'Almacén Central',
        ubicacion: 'Terminal 1 - Sótano',
        capacidad: '1000 pallets'
      }
    });
  }

  if (!admin || !tipoPapelBT || !tipoPapelBP) {
    console.error('Faltan datos base (Usuario o TipoPapel). Asegúrate de haber ejecutado los seeds previos.');
    return;
  }

  // 1. Simular ENTRADA de inventario inicial a través del controlador (para no saltar la lógica)
  // Pero aquí estamos en seed, lo haremos directo con la lógica de transacción.
  
  await prisma.$transaction(async (tx) => {
    // Crear o actualizar stock BT
    const stockBT = await tx.stockAlmacen.findFirst({ where: { almacenId: almacen.id, tipoPapelId: tipoPapelBT.id } });
    if (stockBT) {
      await tx.stockAlmacen.update({ where: { id: stockBT.id }, data: { cantidadActual: stockBT.cantidadActual + 15000 } });
    } else {
      await tx.stockAlmacen.create({ data: { almacenId: almacen.id, tipoPapelId: tipoPapelBT.id, cantidadActual: 15000 } });
    }

    // Registrar movimiento BT
    await tx.movimientoInventario.create({
      data: {
        tipoPapelId: tipoPapelBT.id,
        almacenDestinoId: almacen.id,
        tipoMovimiento: 'ENTRADA',
        cantidad: 15000,
        usuarioId: admin.id,
        comentarios: 'Carga inicial de inventario - Baggage Tags'
      }
    });

    // Crear o actualizar stock BP
    const stockBP = await tx.stockAlmacen.findFirst({ where: { almacenId: almacen.id, tipoPapelId: tipoPapelBP.id } });
    if (stockBP) {
      await tx.stockAlmacen.update({ where: { id: stockBP.id }, data: { cantidadActual: stockBP.cantidadActual + 5000 } });
    } else {
      await tx.stockAlmacen.create({ data: { almacenId: almacen.id, tipoPapelId: tipoPapelBP.id, cantidadActual: 5000 } });
    }

    // Registrar movimiento BP
    await tx.movimientoInventario.create({
      data: {
        tipoPapelId: tipoPapelBP.id,
        almacenDestinoId: almacen.id,
        tipoMovimiento: 'ENTRADA',
        cantidad: 5000,
        usuarioId: admin.id,
        comentarios: 'Carga inicial de inventario - Boarding Passes'
      }
    });
  });

  console.log('Movimientos iniciales de entrada creados exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

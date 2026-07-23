import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de base de datos ampliado...');

  // 1. Crear roles
  const rolesData = [
    { nombre: 'Admin', descripcion: 'Administrador del sistema' },
    { nombre: 'Supervisor', descripcion: 'Supervisor de almacén' },
    { nombre: 'Operador', descripcion: 'Operador de área o inventario' },
    { nombre: 'Ejecutivo', descripcion: 'Solo lectura para dashboards' },
  ];

  const roles = [];
  for (const r of rolesData) {
    const rol = await prisma.rol.upsert({
      where: { nombre: r.nombre },
      update: {},
      create: r,
    });
    roles.push(rol);
  }
  console.log('Roles listos.');

  // 2. Crear usuario admin por defecto
  const adminRole = roles.find((r) => r.nombre === 'Admin');
  let adminUser = null;
  if (adminRole) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    adminUser = await prisma.usuario.upsert({
      where: { email: 'admin@cun.mx' },
      update: {},
      create: {
        nombre: 'Administrador CUN',
        email: 'admin@cun.mx',
        passwordHash,
        rolId: adminRole.id,
      },
    });
    console.log('Usuario admin listo.');
  }

  // 3. Crear Tipos de Papel
  const tipoPapel1 = await prisma.tipoPapel.upsert({
    where: { codigo: 'BTP-0001' },
    update: {},
    create: {
      codigo: 'BTP-0001',
      descripcion: 'Rollos Etiqueta Equipaje (BTP-0001)',
      dimensiones: '21.25" x 2.125"',
      gramaje: '80g',
      material: 'Papel térmico top coated',
      proveedor: 'SITA',
      unidadMedida: 'Rollo',
      costoUnitario: 12.50,
      stockMinimo: 50,
      stockMaximo: 500,
      puntoReorden: 100,
    },
  });

  const tipoPapel2 = await prisma.tipoPapel.upsert({
    where: { codigo: 'ATB-0001' },
    update: {},
    create: {
      codigo: 'ATB-0001',
      descripcion: 'Rollos Pases de Abordar (ATB-0001)',
      dimensiones: '8" x 3.25"',
      gramaje: '105g',
      material: 'Cartulina térmica',
      proveedor: 'SITA',
      unidadMedida: 'Caja (500pz)',
      costoUnitario: 45.00,
      stockMinimo: 20,
      stockMaximo: 200,
      puntoReorden: 50,
    },
  });
  console.log('Catálogo de papel listo.');

  // 4. Crear Almacenes
  const almacenCentral = await prisma.almacen.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      nombre: 'Almacén Central',
      ubicacion: 'Terminal 2',
      proveedor: 'ASUR',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Almacén Central',
      ubicacion: 'Terminal 2',
      capacidad: 'Grande',
      proveedor: 'ASUR',
    },
  });

  const almacenT4 = await prisma.almacen.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {
      nombre: 'Almacén Central',
      ubicacion: 'Terminal 4',
      proveedor: 'SITA',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      nombre: 'Almacén Central',
      ubicacion: 'Terminal 4',
      capacidad: 'Mediana',
      proveedor: 'SITA',
    },
  });

  const almacenT3 = await prisma.almacen.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {
      nombre: 'Almacén Terminal 3',
      ubicacion: 'Planta Baja T3',
      proveedor: 'OTRO',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      nombre: 'Almacén Terminal 3',
      ubicacion: 'Planta Baja T3',
      capacidad: 'Mediana',
      proveedor: 'OTRO',
    },
  });
  console.log('Almacenes listos.');

  // 5. Crear Áreas y Periféricos
  const areaCheckIn = await prisma.areaAeropuerto.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      nombre: 'Mostradores Check-in',
      terminal: 'Terminal 2',
      zona: 'Público',
    },
  });

  const areaAbordaje = await prisma.areaAeropuerto.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      nombre: 'Salas de Abordaje',
      terminal: 'Terminal 3',
      zona: 'Estéril',
    },
  });

  await prisma.periferico.upsert({
    where: { identificadorUnico: 'PRN-CUN-T2-001' },
    update: {},
    create: {
      identificadorUnico: 'PRN-CUN-T2-001',
      marca: 'Access-IS',
      modelo: 'BGR750',
      areaId: areaCheckIn.id,
      estadoOperativo: 'ACTIVO',
    },
  });

  await prisma.periferico.upsert({
    where: { identificadorUnico: 'PRN-CUN-T3-002' },
    update: {},
    create: {
      identificadorUnico: 'PRN-CUN-T3-002',
      marca: 'Custom',
      modelo: 'KPM302H',
      areaId: areaAbordaje.id,
      estadoOperativo: 'MANTENIMIENTO',
    },
  });
  console.log('Áreas y Periféricos listos.');

  // 6. Crear Lotes y Stock
  const lote1 = await prisma.lote.upsert({
    where: { tipoPapelId_numeroLote: { tipoPapelId: tipoPapel1.id, numeroLote: 'LOTE-2026-001' } },
    update: {},
    create: {
      tipoPapelId: tipoPapel1.id,
      numeroLote: 'LOTE-2026-001',
      fechaRecepcion: new Date(),
    },
  });

  await prisma.stockAlmacen.deleteMany();

  await prisma.stockAlmacen.create({
    data: {
      almacenId: almacenCentral.id,
      tipoPapelId: tipoPapel1.id,
      cantidadActual: 350,
      loteId: lote1.id
    },
  });

  await prisma.stockAlmacen.create({
    data: {
      almacenId: almacenCentral.id,
      tipoPapelId: tipoPapel2.id,
      cantidadActual: 120,
      loteId: lote1.id
    },
  });

  await prisma.stockAlmacen.create({
    data: {
      almacenId: almacenT3.id,
      tipoPapelId: tipoPapel1.id,
      cantidadActual: 45,
      loteId: lote1.id
    },
  });
  console.log('Stock y Lotes listos.');

  // 7. Crear Movimientos y Auditoría si tenemos usuario
  if (adminUser) {
    // Solo insertamos movimientos si no existen (simplificado, contamos movimientos)
    const movsCount = await prisma.movimientoInventario.count();
    if (movsCount === 0) {
      await prisma.movimientoInventario.createMany({
        data: [
          {
            tipoPapelId: tipoPapel1.id,
            loteId: lote1.id,
            almacenDestinoId: almacenCentral.id,
            tipoMovimiento: 'ENTRADA',
            cantidad: 500,
            usuarioId: adminUser.id,
            comentarios: 'Recepcion inicial de proveedor',
          },
          {
            tipoPapelId: tipoPapel1.id,
            almacenOrigenId: almacenCentral.id,
            almacenDestinoId: almacenT3.id,
            tipoMovimiento: 'TRANSFERENCIA',
            cantidad: 50,
            usuarioId: adminUser.id,
            comentarios: 'Reabastecimiento Terminal 3',
          },
          {
            tipoPapelId: tipoPapel2.id,
            almacenOrigenId: almacenCentral.id,
            tipoMovimiento: 'SALIDA',
            cantidad: 10,
            usuarioId: adminUser.id,
            comentarios: 'Uso operativo en mostradores',
          },
        ],
      });

      await prisma.auditoriaAcciones.createMany({
        data: [
          { usuarioId: adminUser.id, accion: 'LOGIN', entidad: 'Auth', detalles: 'Inicio de sesión exitoso' },
          { usuarioId: adminUser.id, accion: 'CREATE', entidad: 'Movimiento', detalles: 'Ingresó 500 unidades' },
          { usuarioId: adminUser.id, accion: 'UPDATE', entidad: 'Periferico', detalles: 'Cambió estado a Mantenimiento' },
        ],
      });
      console.log('Movimientos y Auditoria de prueba listos.');
    }
  }

  console.log('¡Proceso de Seed completado con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

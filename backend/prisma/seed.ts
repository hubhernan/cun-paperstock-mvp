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

  const operadorRole = roles.find((r) => r.nombre === 'Operador');
  let operadores = [];
  if (operadorRole) {
    const passwordHash = await bcrypt.hash('operador123', 10);
    const u1 = await prisma.usuario.upsert({
      where: { email: 'ricardo@cun.mx' },
      update: {},
      create: {
        nombre: 'Ricardo Hernandez',
        email: 'ricardo@cun.mx',
        passwordHash,
        rolId: operadorRole.id,
        turno: 'Mañana',
        dispositivo: 'Tableta (iPad)',
      },
    });
    const u2 = await prisma.usuario.upsert({
      where: { email: 'flor@cun.mx' },
      update: {},
      create: {
        nombre: 'Flor Toledo',
        email: 'flor@cun.mx',
        passwordHash,
        rolId: operadorRole.id,
        turno: 'Tarde',
        dispositivo: 'Teléfono Celular',
      },
    });
    const u3 = await prisma.usuario.upsert({
      where: { email: 'sheldon@cun.mx' },
      update: {},
      create: {
        nombre: 'Sheldon Craig',
        email: 'sheldon@cun.mx',
        passwordHash,
        rolId: operadorRole.id,
        turno: 'Noche',
        dispositivo: 'Radio Troncalizado / Tableta',
      },
    });
    operadores.push(u1, u2, u3);
    console.log('Ingenieros de campo (Usuarios) listos.');
  }

  // 3. Crear Tipos de Papel
  const tipoPapel1 = await prisma.tipoPapel.upsert({
    where: { codigo: 'BTP-01' },
    update: {},
    create: {
      codigo: 'BTP-01',
      descripcion: 'Rollos Etiquet Equipaje ( BTP-01)',
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
    where: { codigo: 'ATB-01' },
    update: {},
    create: {
      codigo: 'ATB-01',
      descripcion: 'Rollos Pases de Abordar (ATB-01)',
      dimensiones: '8" x 3.25"',
      gramaje: '105g',
      material: 'Cartulina térmica',
      proveedor: 'SITA',
      unidadMedida: 'Rollo',
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
      proveedor: 'SITA',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Almacén Central',
      ubicacion: 'Terminal 2',
      capacidad: 'Grande',
      proveedor: 'SITA',
    },
  });

  const almacenT4 = await prisma.almacen.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {
      nombre: 'Almacén Local',
      ubicacion: 'Terminal 4',
      proveedor: 'SITA',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      nombre: 'Almacén Local',
      ubicacion: 'Terminal 4',
      capacidad: 'Mediana',
      proveedor: 'SITA',
    },
  });

  const almacenT3 = await prisma.almacen.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {
      nombre: 'Almacén Local',
      ubicacion: 'Terminal 3',
      proveedor: 'SITA',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      nombre: 'Almacén Local',
      ubicacion: 'Terminal 3',
      capacidad: 'Mediana',
      proveedor: 'SITA',
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
      terminal: 'Varias',
      zona: 'Público',
    },
  });

  const areaT3 = await prisma.areaAeropuerto.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      nombre: 'Kioskos Terminal 3',
      terminal: 'Terminal 3',
      zona: 'Público',
    },
  });

  const areaT4 = await prisma.areaAeropuerto.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      nombre: 'Kioskos Terminal 4',
      terminal: 'Terminal 4',
      zona: 'Público',
    },
  });

  // Generar 60 kioskos para Terminal 3 (CUN3AKA001 a CUN3AKA060)
  const perifsT3 = [];
  for (let i = 1; i <= 60; i++) {
    const num = i.toString().padStart(3, '0');
    perifsT3.push({
      identificadorUnico: `CUN3AKA${num}`,
      marca: 'SITA',
      modelo: 'Kiosk V2',
      areaId: areaT3.id,
      estadoOperativo: 'ACTIVO',
      nivelAtb: 100,
      nivelBtp: 100,
    });
  }
  await prisma.periferico.createMany({
    data: perifsT3,
    skipDuplicates: true,
  });

  // Generar 74 kioskos para Terminal 4 (CUN4AKA001 a CUN4AKA074)
  const perifsT4 = [];
  for (let i = 1; i <= 74; i++) {
    const num = i.toString().padStart(3, '0');
    perifsT4.push({
      identificadorUnico: `CUN4AKA${num}`,
      marca: 'SITA',
      modelo: 'Kiosk V3',
      areaId: areaT4.id,
      estadoOperativo: 'ACTIVO',
      nivelAtb: 100,
      nivelBtp: 100,
    });
  }
  await prisma.periferico.createMany({
    data: perifsT4,
    skipDuplicates: true,
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

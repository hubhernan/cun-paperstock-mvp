import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Sincronizando seed de base de datos con versión de producción/local...');

  // 1. Crear roles
  const rolesData = [
    { nombre: 'Admin', descripcion: 'Administrador del sistema (Super Usuario)' },
    { nombre: 'Supervisor', descripcion: 'Supervisor de almacén y logística' },
    { nombre: 'Operador', descripcion: 'Operador e Ingeniero de campo' },
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

  // 2. Crear usuarios
  const adminRole = roles.find((r) => r.nombre === 'Admin');
  const operadorRole = roles.find((r) => r.nombre === 'Operador');
  const supervisorRole = roles.find((r) => r.nombre === 'Supervisor');

  const passwordHashAdmin = await bcrypt.hash('admin123', 10);
  const passwordHashOp = await bcrypt.hash('operador123', 10);

  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@cun.mx' },
    update: { activo: true },
    create: {
      nombre: 'Administrador CUN',
      email: 'admin@cun.mx',
      passwordHash: passwordHashAdmin,
      rolId: adminRole!.id,
      turno: 'Matutino',
      dispositivo: 'HP Server',
      activo: true
    },
  });

  const ricardoUser = await prisma.usuario.upsert({
    where: { email: 'ricardo@cun.mx' },
    update: { activo: true, dispositivo: 'iPad' },
    create: {
      nombre: 'Ricardo Hernandez',
      email: 'ricardo@cun.mx',
      passwordHash: passwordHashOp,
      rolId: operadorRole!.id,
      turno: 'Matutino',
      dispositivo: 'iPad',
      activo: true
    },
  });

  const florUser = await prisma.usuario.upsert({
    where: { email: 'flor@cun.mx' },
    update: { activo: true, dispositivo: 'Pixel 10' },
    create: {
      nombre: 'Flor Toledo',
      email: 'flor@cun.mx',
      passwordHash: passwordHashOp,
      rolId: supervisorRole!.id,
      turno: 'Vespertino',
      dispositivo: 'Pixel 10',
      activo: true
    },
  });

  const sheldonUser = await prisma.usuario.upsert({
    where: { email: 'sheldon@cun.mx' },
    update: { activo: true, dispositivo: 'iPad' },
    create: {
      nombre: 'Sheldon Craig',
      email: 'sheldon@cun.mx',
      passwordHash: passwordHashOp,
      rolId: operadorRole!.id,
      turno: 'Nocturno',
      dispositivo: 'iPad',
      activo: true
    },
  });

  console.log('Usuarios e Ingenieros de campo listos.');

  // 3. Crear Tipos de Papel
  const tipoPapel1 = await prisma.tipoPapel.upsert({
    where: { codigo: 'BTP-01' },
    update: { unidadMedida: 'Rollo' },
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
    update: { unidadMedida: 'Rollo' },
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

  // 4. Crear Almacenes
  const almacenCentral = await prisma.almacen.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      nombre: 'Almacén Central Terminal 2',
      ubicacion: 'Terminal 2',
      capacidad: 'Grande',
      proveedor: 'SITA',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Almacén Central Terminal 2',
      ubicacion: 'Terminal 2',
      capacidad: 'Grande',
      proveedor: 'SITA',
    },
  });

  const almacenT4 = await prisma.almacen.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {
      nombre: 'Almacén Local Terminal 4',
      ubicacion: 'Terminal 4',
      capacidad: 'Mediana',
      proveedor: 'SITA',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      nombre: 'Almacén Local Terminal 4',
      ubicacion: 'Terminal 4',
      capacidad: 'Mediana',
      proveedor: 'SITA',
    },
  });

  const almacenT3 = await prisma.almacen.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {
      nombre: 'Almacén Local Terminal 3',
      ubicacion: 'Terminal 3',
      capacidad: 'Mediana',
      proveedor: 'SITA',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      nombre: 'Almacén Local Terminal 3',
      ubicacion: 'Terminal 3',
      capacidad: 'Mediana',
      proveedor: 'SITA',
    },
  });

  // 5. Stock de Almacenes Sincronizado
  await prisma.stockAlmacen.deleteMany();
  await prisma.stockAlmacen.createMany({
    data: [
      { almacenId: almacenCentral.id, tipoPapelId: tipoPapel2.id, cantidadActual: 238 }, // ATB 238
      { almacenId: almacenCentral.id, tipoPapelId: tipoPapel1.id, cantidadActual: 495 }, // BTP 495
      { almacenId: almacenT4.id, tipoPapelId: tipoPapel2.id, cantidadActual: 75 },      // ATB 75
      { almacenId: almacenT4.id, tipoPapelId: tipoPapel1.id, cantidadActual: 491 },     // BTP 491
      { almacenId: almacenT3.id, tipoPapelId: tipoPapel2.id, cantidadActual: 81 },      // ATB 81
      { almacenId: almacenT3.id, tipoPapelId: tipoPapel1.id, cantidadActual: 180 },     // BTP 180
    ]
  });

  // 6. Áreas y Periféricos
  const areaT2 = await prisma.areaAeropuerto.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: { nombre: 'Kioskos Terminal 2', terminal: 'Terminal 2' },
    create: { id: '00000000-0000-0000-0000-000000000003', nombre: 'Kioskos Terminal 2', terminal: 'Terminal 2', zona: 'Público' },
  });

  const areaT3 = await prisma.areaAeropuerto.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: { nombre: 'Kioskos Terminal 3', terminal: 'Terminal 3' },
    create: { id: '00000000-0000-0000-0000-000000000004', nombre: 'Kioskos Terminal 3', terminal: 'Terminal 3', zona: 'Público' },
  });

  const areaT4 = await prisma.areaAeropuerto.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: { nombre: 'Kioskos Terminal 4', terminal: 'Terminal 4' },
    create: { id: '00000000-0000-0000-0000-000000000005', nombre: 'Kioskos Terminal 4', terminal: 'Terminal 4', zona: 'Público' },
  });

  // Generar kioskos T2 (48 Kioskos)
  const perifsT2 = [];
  for (let i = 1; i <= 48; i++) {
    const num = i.toString().padStart(3, '0');
    const isCriticalBtp = i === 2 || i === 9; // Kioskos CUN2AKA002 y CUN2AKA009 en rojo BTP
    perifsT2.push({
      identificadorUnico: `CUN2AKA${num}`,
      marca: 'SITA',
      modelo: 'Kiosk V2',
      areaId: areaT2.id,
      estadoOperativo: 'ACTIVO',
      nivelAtb: 100,
      nivelBtp: isCriticalBtp ? 15 : 100,
    });
  }
  await prisma.periferico.createMany({ data: perifsT2, skipDuplicates: true });

  // Generar kioskos T3 (60 Kioskos)
  const perifsT3 = [];
  for (let i = 1; i <= 60; i++) {
    const num = i.toString().padStart(3, '0');
    const isCriticalAtb = [4, 5, 6, 8, 9, 10].includes(i); // Kioskos CUN3AKA004, 005, 006, 008, 009, 010 en rojo ATB
    perifsT3.push({
      identificadorUnico: `CUN3AKA${num}`,
      marca: 'SITA',
      modelo: 'Kiosk V2',
      areaId: areaT3.id,
      estadoOperativo: 'ACTIVO',
      nivelAtb: isCriticalAtb ? 15 : 100,
      nivelBtp: 100,
    });
  }
  await prisma.periferico.createMany({ data: perifsT3, skipDuplicates: true });

  // Generar kioskos T4 (74 Kioskos)
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
  await prisma.periferico.createMany({ data: perifsT4, skipDuplicates: true });

  // 7. Crear Alertas Activas Identificables
  await prisma.alertaStock.deleteMany();
  await prisma.alertaStock.createMany({
    data: [
      { tipoPapelId: tipoPapel1.id, mensaje: 'Kiosko CUN2AKA002 en Kioskos Terminal 2 tiene nivel crítico de BTP (semáforo en Rojo).', leida: false },
      { tipoPapelId: tipoPapel1.id, mensaje: 'Kiosko CUN2AKA009 en Kioskos Terminal 2 tiene nivel crítico de BTP (semáforo en Rojo).', leida: false },
      { tipoPapelId: tipoPapel2.id, mensaje: 'Kiosko CUN3AKA004 en Kioskos Terminal 3 tiene nivel crítico de ATB (semáforo en Rojo).', leida: false },
      { tipoPapelId: tipoPapel2.id, mensaje: 'Kiosko CUN3AKA005 en Kioskos Terminal 3 tiene nivel crítico de ATB (semáforo en Rojo).', leida: false },
      { tipoPapelId: tipoPapel2.id, mensaje: 'Kiosko CUN3AKA006 en Kioskos Terminal 3 tiene nivel crítico de ATB (semáforo en Rojo).', leida: false },
      { tipoPapelId: tipoPapel2.id, mensaje: 'Kiosko CUN3AKA008 en Kioskos Terminal 3 tiene nivel crítico de ATB (semáforo en Rojo).', leida: false },
      { tipoPapelId: tipoPapel2.id, mensaje: 'Kiosko CUN3AKA009 en Kioskos Terminal 3 tiene nivel crítico de ATB (semáforo en Rojo).', leida: false },
      { tipoPapelId: tipoPapel2.id, mensaje: 'Kiosko CUN3AKA010 en Kioskos Terminal 3 tiene nivel crítico de ATB (semáforo en Rojo).', leida: false },
    ]
  });

  // 8. Crear Incidentes & Tickets
  await prisma.incidenteDiscrepancia.deleteMany();
  await prisma.incidenteDiscrepancia.createMany({
    data: [
      {
        terminal: 'Almacén Local Terminal 3',
        ingenieroId: adminUser.id,
        stockCalculado: 192,
        stockFisico: 180,
        diferencia: -12,
        estado: 'INVESTIGACION',
        comentarios: 'Discrepancia reportada al recuento físico. Faltan 12 rollos por posible daño en rodillo.\n[12/08/2026 12:47 - Administrador CUN (INVESTIGACION)]: Se inicia investigación en sitio con supervisor de turno.'
      },
      {
        terminal: 'Almacén Central',
        ingenieroId: adminUser.id,
        stockCalculado: 120,
        stockFisico: 90,
        diferencia: -30,
        estado: 'ABIERTO',
        comentarios: 'Descuadre en inventario lógico vs físico al recepcionar lote.'
      }
    ]
  });

  // 9. Historial de Auditoría
  await prisma.auditoriaAcciones.deleteMany();
  await prisma.auditoriaAcciones.createMany({
    data: [
      { usuarioId: adminUser.id, accion: 'LOGIN', entidad: 'Usuario', detalles: 'Inicio de sesión exitoso' },
      { usuarioId: adminUser.id, accion: 'CAMBIO_ESTADO_INCIDENTE', entidad: 'IncidenteDiscrepancia', detalles: 'Estado cambiado a INVESTIGACION. Nota: Se inicia investigación en sitio con supervisor de turno.' },
      { usuarioId: adminUser.id, accion: 'REPORTE_DISCREPANCIA_ALMACEN', entidad: 'Almacen', detalles: 'Discrepancia en Almacén Local Terminal 3: Sistema 192 vs Físico 180 (BTP-01)' },
      { usuarioId: ricardoUser.id, accion: 'REGISTRO_INTERVENCION', entidad: 'Periferico', detalles: 'Cambio de Papel BTP en Kiosko CUN3AKA051 (Ingeniero: Ricardo Hernandez)' },
      { usuarioId: ricardoUser.id, accion: 'REGISTRO_INTERVENCION', entidad: 'Periferico', detalles: 'Cambio de Papel ATB en Kiosko CUN3AKA051 (Ingeniero: Ricardo Hernandez)' },
      { usuarioId: florUser.id, accion: 'LOGIN', entidad: 'Usuario', detalles: 'Inicio de sesión exitoso' },
      { usuarioId: ricardoUser.id, accion: 'LOGOUT', entidad: 'Usuario', detalles: 'Cierre de sesión exitoso' },
    ]
  });

  // 10. Generar Historial Completo (Últimos 60 Días) para Reportes y Movimientos
  console.log('🌱 Generando datos históricos de inventario e intervenciones (60 días)...');

  await prisma.movimientoInventario.deleteMany();
  await prisma.intervencionKiosko.deleteMany();
  await prisma.asignacionPeriferico.deleteMany();

  const usuarios = [ricardoUser, florUser, adminUser];
  const todosKioskos = await prisma.periferico.findMany();

  const hoy = new Date();
  const diasAtras = [60, 45, 30, 25, 20, 15, 12, 10, 7, 5, 3, 2, 1];

  // Entradas de Inventario (Recepciones de Lotes)
  for (const offset of [60, 45, 30, 15, 5]) {
    const fecha = new Date(hoy.getTime() - offset * 24 * 60 * 60 * 1000);
    fecha.setHours(9, 30, 0, 0);

    await prisma.movimientoInventario.create({
      data: {
        tipoPapelId: tipoPapel2.id,
        almacenDestinoId: almacenCentral.id,
        tipoMovimiento: 'ENTRADA',
        cantidad: 300,
        usuarioId: adminUser.id,
        fechaMovimiento: fecha,
        comentarios: `Recepción de Lote ATB de Proveedor SITA (Hace ${offset} días)`
      }
    });

    await prisma.movimientoInventario.create({
      data: {
        tipoPapelId: tipoPapel1.id,
        almacenDestinoId: almacenCentral.id,
        tipoMovimiento: 'ENTRADA',
        cantidad: 500,
        usuarioId: adminUser.id,
        fechaMovimiento: fecha,
        comentarios: `Recepción de Lote BTP de Proveedor SITA (Hace ${offset} días)`
      }
    });
  }

  // Transferencias a Almacenes Locales T3 y T4
  for (const offset of [55, 40, 25, 12, 4]) {
    const fecha = new Date(hoy.getTime() - offset * 24 * 60 * 60 * 1000);
    fecha.setHours(11, 15, 0, 0);

    await prisma.movimientoInventario.create({
      data: {
        tipoPapelId: tipoPapel2.id,
        almacenOrigenId: almacenCentral.id,
        almacenDestinoId: almacenT3.id,
        tipoMovimiento: 'TRANSFERENCIA',
        cantidad: 80,
        usuarioId: adminUser.id,
        fechaMovimiento: fecha,
        comentarios: `Traspaso programado Almacén Central -> Almacén T3`
      }
    });

    await prisma.movimientoInventario.create({
      data: {
        tipoPapelId: tipoPapel1.id,
        almacenOrigenId: almacenCentral.id,
        almacenDestinoId: almacenT4.id,
        tipoMovimiento: 'TRANSFERENCIA',
        cantidad: 150,
        usuarioId: adminUser.id,
        fechaMovimiento: fecha,
        comentarios: `Traspaso programado Almacén Central -> Almacén T4`
      }
    });
  }

  // Intervenciones en Kioskos, Salidas de Stock y Asignaciones
  let countIntervenciones = 0;
  for (const offset of diasAtras) {
    const fechaBase = new Date(hoy.getTime() - offset * 24 * 60 * 60 * 1000);
    const numIntervenciones = 6 + (offset % 8);

    for (let k = 0; k < numIntervenciones; k++) {
      const idxKiosko = (offset * 7 + k * 13) % todosKioskos.length;
      const kiosko = todosKioskos[idxKiosko];
      const ingeniero = usuarios[k % usuarios.length];
      const esATB = k % 2 === 0;
      const tipoPapelObj = esATB ? tipoPapel2 : tipoPapel1;
      const accionNombre = esATB ? 'Cambio de Papel ATB' : 'Cambio de Papel BTP';

      let almacenOrigen = almacenCentral;
      if (kiosko.identificadorUnico.startsWith('CUN3')) almacenOrigen = almacenT3;
      if (kiosko.identificadorUnico.startsWith('CUN4')) almacenOrigen = almacenT4;

      const fechaIntervencion = new Date(fechaBase.getTime() + (8 + k) * 45 * 60 * 1000);

      await prisma.intervencionKiosko.create({
        data: {
          perifericoId: kiosko.id,
          ingenieroId: ingeniero.id,
          accion: accionNombre,
          almacenOrigenId: almacenOrigen.id,
          comentarios: `Mantenimiento preventivo en turno (${accionNombre})`,
          fecha: fechaIntervencion
        }
      });

      await prisma.movimientoInventario.create({
        data: {
          tipoPapelId: tipoPapelObj.id,
          almacenOrigenId: almacenOrigen.id,
          tipoMovimiento: 'SALIDA',
          cantidad: 1,
          usuarioId: ingeniero.id,
          fechaMovimiento: fechaIntervencion,
          comentarios: `Cambio manual en Kiosko ${kiosko.identificadorUnico}`
        }
      });

      await prisma.asignacionPeriferico.create({
        data: {
          perifericoId: kiosko.id,
          tipoPapelId: tipoPapelObj.id,
          cantidadAsignada: 1,
          usuarioId: ingeniero.id,
          fechaAsignacion: fechaIntervencion
        }
      });

      countIntervenciones++;
    }
  }

  console.log(`✅ Se generaron ${countIntervenciones} intervenciones y movimientos históricos exitosamente.`);

  console.log('¡Proceso de Seed ampliado completado con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga masiva de kioskos para pruebas (Terminal 3 y Terminal 4)...');

  // Asegurarnos de que existen las áreas
  const areaT3 = await prisma.areaAeropuerto.upsert({
    where: { id: 't3-mock-id' }, // Upsert by a known ID or by some field. Prisma schema doesn't have unique on nombre/terminal, so we use a dummy ID or findFirst
    update: {},
    create: {
      id: 't3-mock-id',
      nombre: 'Salas de Abordaje T3',
      terminal: 'Terminal 3',
      zona: 'Estéril',
    }
  });

  const areaT4 = await prisma.areaAeropuerto.upsert({
    where: { id: 't4-mock-id' },
    update: {},
    create: {
      id: 't4-mock-id',
      nombre: 'Salas de Abordaje T4',
      terminal: 'Terminal 4',
      zona: 'Estéril',
    }
  });

  // Generar 60 kioskos para T3
  const kioskosT3 = [];
  for (let i = 1; i <= 60; i++) {
    kioskosT3.push({
      identificadorUnico: `PRN-CUN-T3-${i.toString().padStart(3, '0')}`,
      marca: i % 2 === 0 ? 'Zebra' : 'Custom',
      modelo: i % 2 === 0 ? 'ZD421' : 'KPM302H',
      areaId: areaT3.id,
      estadoOperativo: 'ACTIVO',
      estadoConexion: Math.random() > 0.1 ? 'ONLINE' : 'OFFLINE',
      nivelAtb: Math.floor(Math.random() * 100) + 1,
      nivelBtp: Math.floor(Math.random() * 100) + 1,
    });
  }

  // Generar 74 kioskos para T4
  const kioskosT4 = [];
  for (let i = 1; i <= 74; i++) {
    kioskosT4.push({
      identificadorUnico: `PRN-CUN-T4-${i.toString().padStart(3, '0')}`,
      marca: i % 3 === 0 ? 'Access-IS' : 'Zebra',
      modelo: i % 3 === 0 ? 'BGR750' : 'ZD500',
      areaId: areaT4.id,
      estadoOperativo: 'ACTIVO',
      estadoConexion: Math.random() > 0.1 ? 'ONLINE' : 'OFFLINE',
      nivelAtb: Math.floor(Math.random() * 100) + 1,
      nivelBtp: Math.floor(Math.random() * 100) + 1,
    });
  }

  console.log('Insertando 60 kioskos para la Terminal 3...');
  await prisma.periferico.createMany({
    data: kioskosT3,
    skipDuplicates: true,
  });

  console.log('Insertando 74 kioskos para la Terminal 4...');
  await prisma.periferico.createMany({
    data: kioskosT4,
    skipDuplicates: true,
  });

  console.log('¡Carga de kioskos completada con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

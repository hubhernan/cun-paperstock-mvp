import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de Fase 2...');

  // Crear Áreas
  const area1 = await prisma.areaAeropuerto.create({
    data: {
      nombre: 'T2 - Check-in SITA',
      terminal: 'Terminal 2',
      zona: 'Check-in A',
    }
  });

  const area2 = await prisma.areaAeropuerto.create({
    data: {
      nombre: 'T3 - Puerta 12',
      terminal: 'Terminal 3',
      zona: 'Abordaje',
    }
  });

  console.log('Áreas creadas.');

  // Crear Periféricos
  const p1 = await prisma.periferico.create({
    data: {
      identificadorUnico: 'PRN-T2-CK-01',
      marca: 'Zebra',
      modelo: 'ZD421',
      areaId: area1.id,
      estadoOperativo: 'ACTIVO'
    }
  });

  const p2 = await prisma.periferico.create({
    data: {
      identificadorUnico: 'PRN-T3-BD-12',
      marca: 'Zebra',
      modelo: 'ZD500',
      areaId: area2.id,
      estadoOperativo: 'ACTIVO'
    }
  });

  console.log('Periféricos creados.');

  // Vincular tipos de papel si existen
  const bt = await prisma.tipoPapel.findUnique({ where: { codigo: 'BT-001' } });
  const bp = await prisma.tipoPapel.findUnique({ where: { codigo: 'BP-001' } });

  if (bt) {
    await prisma.perifericoTipoPapel.create({
      data: { perifericoId: p1.id, tipoPapelId: bt.id }
    });
  }

  if (bp) {
    await prisma.perifericoTipoPapel.create({
      data: { perifericoId: p2.id, tipoPapelId: bp.id }
    });
  }

  console.log('Compatibilidad vinculada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

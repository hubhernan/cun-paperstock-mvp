const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const admin = await prisma.usuario.findFirst();
  const kioskos = await prisma.periferico.findMany({ take: 15 });
  const almacen = await prisma.almacen.findFirst();
  
  if (!admin || kioskos.length === 0) {
    console.log("No data found to seed interventions");
    return;
  }
  
  const intervenciones = [];
  const hoy = new Date();
  
  for(let i = 0; i < 20; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - Math.floor(Math.random() * 5)); // Últimos 5 días
    
    intervenciones.push({
      perifericoId: kioskos[Math.floor(Math.random() * kioskos.length)].id,
      ingenieroId: admin.id,
      accion: Math.random() > 0.5 ? 'Cambio de Papel ATB' : 'Cambio de Papel BTP',
      almacenOrigenId: almacen.id,
      comentarios: 'Generado para demostración de reportes históricos',
      fecha: d
    });
  }
  
  await prisma.intervencionKiosko.createMany({ data: intervenciones });
  console.log("Insertados 20 registros históricos de intervenciones en kioskos.");
}

run().catch(console.error).finally(() => prisma.$disconnect());

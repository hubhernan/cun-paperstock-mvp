"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Iniciando seed de base de datos...');
    // Crear roles
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
    console.log('Roles creados/verificados.');
    // Crear usuario admin por defecto
    const adminRole = roles.find(r => r.nombre === 'Admin');
    if (adminRole) {
        const passwordHash = await bcryptjs_1.default.hash('admin123', 10);
        await prisma.usuario.upsert({
            where: { email: 'admin@cun.mx' },
            update: {},
            create: {
                nombre: 'Administrador CUN',
                email: 'admin@cun.mx',
                passwordHash,
                rolId: adminRole.id,
            },
        });
        console.log('Usuario admin creado (admin@cun.mx / admin123).');
    }
    // Opcional: Crear tipos de papel básicos de prueba
    await prisma.tipoPapel.upsert({
        where: { codigo: 'BT-001' },
        update: {},
        create: {
            codigo: 'BT-001',
            descripcion: 'Bag Tag Standard (Térmico directo)',
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
    await prisma.tipoPapel.upsert({
        where: { codigo: 'BP-001' },
        update: {},
        create: {
            codigo: 'BP-001',
            descripcion: 'Boarding Pass CUN',
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
    console.log('Tipos de papel de muestra creados.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map
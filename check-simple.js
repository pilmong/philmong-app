const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: {
            name: true,
            workDivision: true
        }
    });
    products.forEach(p => {
        console.log(`[${p.workDivision}] ${p.name}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

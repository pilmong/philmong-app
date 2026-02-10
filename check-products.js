const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: { name: true, price: true }
    });
    console.log("Total products:", products.length);
    products.forEach(p => {
        console.log(`${p.name}: ${p.price}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({ select: { name: true } });
    console.log('Current Products:', JSON.stringify(products));
}

main().finally(() => prisma.$disconnect());

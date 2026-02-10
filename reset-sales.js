const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearData() {
    try {
        console.log('Resetting Sales data...');
        // Cascade delete handles saleItems if configured, but explicit delete is safer
        await prisma.saleItem.deleteMany({});
        await prisma.sale.deleteMany({});
        console.log('Success: All sales records deleted.');
    } catch (error) {
        console.error('Error clearing data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearData();

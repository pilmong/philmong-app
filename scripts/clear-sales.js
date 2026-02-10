
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Start clearing sales data...');

    try {
        // Delete all Sale records. 
        // Due to Cascade delete in schema (Sale -> SaleItem), items will be automatically deleted.
        const deleted = await prisma.sale.deleteMany({});
        console.log(`Deleted ${deleted.count} sales records.`);
    } catch (e) {
        console.error('Error deleting sales:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

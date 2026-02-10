const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        const saleCount = await prisma.sale.count();
        const itemCount = await prisma.saleItem.count();
        console.log(`Sales count: ${saleCount}`);
        console.log(`SaleItems count: ${itemCount}`);
    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();

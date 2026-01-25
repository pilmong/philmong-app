const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    const permissions = ["DASHBOARD", "ORDERS", "KITCHEN", "SUBDIVISION", "STATS", "LUNCH", "PRODUCTS", "SETTINGS", "USERS", "LUNCH_CLIENTS", "LUNCH_MENU", "LUNCH_STATS", "LUNCH_WORK", "LUNCH_KITCHEN_DOC", "LUNCH_LABELS", "LUNCH_SETTLEMENT"];

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            name: '최고관리자',
            role: 'ADMIN',
            permissions: JSON.stringify(permissions),
            status: 'ACTIVE'
        },
    });

    console.log('Initial Admin Created:', admin.username);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

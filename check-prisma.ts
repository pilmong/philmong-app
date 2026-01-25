import { prisma } from './src/lib/prisma';

async function checkPrisma() {
    console.log('Prisma Models:', Object.keys(prisma).filter(k => !k.startsWith('_')));
    process.exit(0);
}

checkPrisma();

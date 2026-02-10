const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. 소분 상품 등록
    await prisma.product.create({
        data: {
            name: "테스트_소분",
            price: 1000,
            type: "REGULAR",
            workDivision: "IMMEDIATE_SUB_PORTIONING",
            status: "SELLING"
        }
    });

    // 2. 가공 상품 등록
    await prisma.product.create({
        data: {
            name: "테스트_가공",
            price: 2000,
            type: "REGULAR",
            workDivision: "PROCESSING",
            status: "SELLING"
        }
    });

    console.log("테스트 데이터 등록 완료");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

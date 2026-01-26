'use server';

import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function getDailyPrepWorkload(date: Date) {
    const start = startOfDay(new Date(date));
    const end = endOfDay(new Date(date));

    try {
        // 1. 일반 예약 및 단체 주문 가져오기
        const generalOrders = await prisma.order.findMany({
            where: {
                pickupDate: { gte: start, lte: end },
                status: { in: ['CONFIRMED', 'PREPARING'] }
            }
        });

        // 2. 런치 서비스 가져오기
        const lunchOrders = await prisma.lunchOrder.findMany({
            where: {
                date: { gte: start, lte: end },
                status: { in: ['CONFIRMED', 'PREPARING', 'PENDING'] }
            },
            include: {
                client: true
            }
        });

        // 3. 상품 마스터 가져오기 (작업 유형 파악용)
        const allProducts = await prisma.product.findMany();
        const productMap = new Map(allProducts.map(p => [p.name, p]));

        // --- 집계 로직 ---
        const aggregationMap = new Map();

        // 일반 주문 합산
        generalOrders.forEach(order => {
            const items = JSON.parse(order.items || '[]');
            items.forEach((item: any) => {
                const current = aggregationMap.get(item.name) || {
                    name: item.name,
                    totalQty: 0,
                    reservations: 0,
                    lunch: 0,
                    workType: productMap.get(item.name)?.workType || 'UNKNOWN'
                };
                aggregationMap.set(item.name, {
                    ...current,
                    totalQty: current.totalQty + item.quantity,
                    reservations: current.reservations + item.quantity
                });
            });
        });

        // 런치 주문 합산 (도시락/샐러드)
        lunchOrders.forEach(order => {
            // 도시락
            if (order.lunchboxCount > 0) {
                const name = '도시락(공통)';
                const current = aggregationMap.get(name) || {
                    name,
                    totalQty: 0,
                    reservations: 0,
                    lunch: 0,
                    workType: 'COOKING'
                };
                aggregationMap.set(name, {
                    ...current,
                    totalQty: current.totalQty + order.lunchboxCount,
                    lunch: current.lunch + order.lunchboxCount
                });
            }
            // 샐러드
            if (order.saladCount > 0) {
                const name = '샐러드(공통)';
                const current = aggregationMap.get(name) || {
                    name,
                    totalQty: 0,
                    reservations: 0,
                    lunch: 0,
                    workType: 'SUBDIVISION'
                };
                aggregationMap.set(name, {
                    ...current,
                    totalQty: current.totalQty + order.saladCount,
                    lunch: current.lunch + order.saladCount
                });
            }
        });

        return Array.from(aggregationMap.values()).sort((a, b) => b.totalQty - a.totalQty);
    } catch (error) {
        console.error('Failed to calculate prep workload:', error);
        return [];
    }
}

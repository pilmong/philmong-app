'use server';

import { prisma } from '@/lib/prisma';
import { getKitchenWorkload } from './lunch';
import { getGeneralKitchenWorkload } from './orders';

export async function getCombinedDashboardData() {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    try {
        // 1. 일반 주문 요약 (General Orders Summary)
        const generalOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startOfToday, lte: endOfToday }
            }
        });

        const generalSummary = {
            total: generalOrders.length,
            pending: generalOrders.filter(o => o.status === 'CONFIRMED').length,
            preparing: generalOrders.filter(o => o.status === 'PREPARING').length,
            completed: generalOrders.filter(o => o.status === 'COMPLETED').length,
            revenue: generalOrders
                .filter(o => o.status === 'COMPLETED' || o.status === 'READY_FOR_PICKUP' || o.status === 'READY_FOR_DELIVERY')
                .reduce((sum, o: any) => sum + (o.totalPrice || 0), 0)
        };

        // 2. 런치 작업량 요약 (Lunch Workload Summary)
        const lunchWorkload = await getKitchenWorkload(startOfToday);

        // 3. 주방 업무 부하 (Merged Kitchen Load)
        const generalKitchen = await getGeneralKitchenWorkload();
        const kitchenLoad = {
            cooking: generalKitchen.cooking.length,
            subdivision: generalKitchen.subdivision.length + generalKitchen.others.length
        };

        // 4. 최근 예약/픽업 (Upcoming Schedules)
        const upcomingOrders = await prisma.order.findMany({
            where: {
                status: { in: ['CONFIRMED', 'PREPARING'] },
                pickupDate: { gte: today }
            },
            orderBy: { pickupDate: 'asc' },
            take: 3
        });

        return {
            date: startOfToday,
            generalSummary,
            lunchSummary: {
                lunchbox: lunchWorkload.total.lunchbox,
                salad: lunchWorkload.total.salad,
                clientCount: lunchWorkload.total.clientCount,
                revenue: lunchWorkload.total.revenue
            },
            kitchenLoad,
            upcoming: upcomingOrders.map(o => ({
                id: o.id,
                customerName: o.customerName,
                pickupType: o.pickupType,
                pickupDate: o.pickupDate,
                items: JSON.parse(o.items || '[]')
            }))
        };
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        throw error;
    }
}

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

export async function getUnifiedBusinessStats() {
    try {
        const { getGeneralStats } = await import('./orders');
        const { getLunchStats } = await import('./lunch');

        const generalStats = await getGeneralStats();
        const lunchStats = await getLunchStats();

        if (!generalStats || !lunchStats) return null;

        // Merge daily trends
        const dailyTrendMap = new Map();

        generalStats.daily.forEach((d: any) => {
            const current = dailyTrendMap.get(d.date) || { date: d.date, general: 0, lunch: 0, total: 0 };
            dailyTrendMap.set(d.date, { ...current, general: current.general + d.revenue, total: current.total + d.revenue });
        });

        lunchStats.dailyTrend.forEach((d: any) => {
            const current = dailyTrendMap.get(d.date) || { date: d.date, general: 0, lunch: 0, total: 0 };
            dailyTrendMap.set(d.date, { ...current, lunch: current.lunch + d.revenue, total: current.total + d.revenue });
        });

        const dailyTrend = Array.from(dailyTrendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        return {
            summary: {
                totalRevenue: generalStats.summary.totalRevenue + lunchStats.total.revenue,
                generalRevenue: generalStats.summary.totalRevenue,
                lunchRevenue: lunchStats.total.revenue,
                totalOrders: generalStats.summary.totalOrders + (lunchStats.total.totalLunchbox + lunchStats.total.totalSalad),
                profit: lunchStats.total.profit, // General profit not calculated yet in orders stats, focus on lunch for now or keep zero
                margin: lunchStats.total.margin
            },
            dailyTrend,
            general: {
                channels: generalStats.channels,
                products: generalStats.products
            },
            lunch: {
                ratio: lunchStats.ratio,
                topClients: lunchStats.topClients
            }
        };
    } catch (error) {
        console.error('getUnifiedBusinessStats Error:', error);
        return null;
    }
}

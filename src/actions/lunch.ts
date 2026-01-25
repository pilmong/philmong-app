'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

// --- 고객사 (LunchClient) 관련 ---

export async function getLunchClients() {
    const clients = await prisma.lunchClient.findMany({
        orderBy: { name: 'asc' },
    });

    // 각 고객사에 연결된 사용자(담당자) 정보 가져오기
    const clientsWithUsers = await Promise.all(clients.map(async (client) => {
        const users = await (prisma as any).user.findMany({
            where: { clientId: client.id },
            select: { id: true, name: true, username: true }
        });
        return { ...client, linkedUsers: users };
    }));

    return clientsWithUsers;
}

export async function upsertLunchClient(data: any) {
    const { id, ...rest } = data;
    if (id) {
        await prisma.lunchClient.update({
            where: { id },
            data: rest,
        });
    } else {
        await prisma.lunchClient.create({
            data: rest,
        });
    }
    revalidatePath('/admin/lunch/clients');
    return { success: true };
}

export async function updateLunchClientMemo(clientId: string, memo: string) {
    await prisma.lunchClient.update({
        where: { id: clientId },
        data: { memo }
    });
    revalidatePath(`/lunch/order/${clientId}`);
    return { success: true };
}

// --- 데일리 메뉴 (LunchDailyMenu) 관련 ---

export async function getLunchDailyMenu(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return await prisma.lunchDailyMenu.findUnique({
        where: { date: startOfDay },
    });
}

export async function upsertLunchDailyMenu(date: Date, layouts: { lunchboxLayout: string, saladLayout: string }) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    await prisma.lunchDailyMenu.upsert({
        where: { date: startOfDay },
        update: layouts,
        create: {
            date: startOfDay,
            ...layouts
        },
    });
    revalidatePath('/admin/lunch/menu');
    revalidatePath('/admin/lunch/work');
    return { success: true };
}

// --- 주문 (LunchOrder) 관련 ---

export async function getLunchOrdersByDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return await prisma.lunchOrder.findMany({
        where: { date: startOfDay },
        include: { client: true },
    });
}

export async function updateLunchOrderCount(clientId: string, date: Date, data: { lunchboxCount: number, saladCount: number, memo?: string, modifiedBy?: string }) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    await prisma.lunchOrder.upsert({
        where: {
            date_clientId: {
                date: startOfDay,
                clientId
            }
        },
        update: data,
        create: {
            date: startOfDay,
            clientId,
            ...data
        },
    });

    revalidatePath(`/lunch/order/${clientId}`);
    revalidatePath('/admin/lunch/orders');
    revalidatePath('/admin/lunch/work');
    return { success: true };
}

export async function updateLunchOrderStatus(orderId: string, status: string) {
    try {
        await (prisma as any).lunchOrder.update({
            where: { id: orderId },
            data: { status },
        });
        revalidatePath('/admin/lunch/work');
        revalidatePath('/admin/lunch/orders');
        revalidatePath('/admin/lunch/settlement');
        return { success: true };
    } catch (error) {
        console.error('updateLunchOrderStatus Error:', error);
        return { success: false, error: '상태 변경 중 오류가 발생했습니다.' };
    }
}

export async function bulkUpdateLunchOrderStatusByPeriod(clientId: string, startDate: Date, endDate: Date, status: string) {
    try {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        await (prisma as any).lunchOrder.updateMany({
            where: {
                clientId,
                date: {
                    gte: start,
                    lte: end
                },
                status: 'COMPLETED' // 주로 COMPLETED인 것만 PAID로 바꿈
            },
            data: { status },
        });

        revalidatePath('/admin/lunch/work');
        revalidatePath('/admin/lunch/settlement');
        return { success: true };
    } catch (error) {
        console.error('bulkUpdateLunchOrderStatusByPeriod Error:', error);
        return { success: false, error: '일괄 처리 중 오류가 발생했습니다.' };
    }
}

// --- 정산 및 명세서 관련 ---

export async function getLunchSettlement(startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const clients = await prisma.lunchClient.findMany({
        where: { status: 'ACTIVE' },
        include: {
            orders: {
                where: {
                    date: {
                        gte: start,
                        lte: end
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    return clients.map(client => {
        const totalLunchbox = client.orders.reduce((sum, o) => sum + o.lunchboxCount, 0);
        const totalSalad = client.orders.reduce((sum, o) => sum + o.saladCount, 0);
        const totalPrice = (totalLunchbox * client.lunchboxPrice) + (totalSalad * client.saladPrice);

        const unpaidOrders = client.orders.filter(o => o.status === 'COMPLETED');
        const unpaidCount = unpaidOrders.length;

        return {
            id: client.id,
            name: client.name,
            lunchboxPrice: client.lunchboxPrice,
            saladPrice: client.saladPrice,
            totalLunchbox,
            totalSalad,
            totalPrice,
            orderCount: client.orders.length,
            unpaidCount
        };
    });
}

export async function getLunchInvoiceData(clientId: string, startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const client = await prisma.lunchClient.findUnique({
        where: { id: clientId },
        include: {
            orders: {
                where: {
                    date: {
                        gte: start,
                        lte: end
                    }
                },
                orderBy: { date: 'asc' }
            }
        }
    });

    if (!client) return null;

    // 메뉴 정보도 함께 가져오기 위해 날짜별로 매핑
    const ordersWithMenu = await Promise.all(client.orders.map(async (order) => {
        const menu = await prisma.lunchDailyMenu.findUnique({
            where: { date: order.date }
        });
        return {
            ...order,
            menu: menu ? JSON.parse(menu.lunchboxLayout) : null
        };
    }));

    return {
        client,
        orders: ordersWithMenu,
        summary: {
            totalLunchbox: client.orders.reduce((sum, o) => sum + o.lunchboxCount, 0),
            totalSalad: client.orders.reduce((sum, o) => sum + o.saladCount, 0),
            totalAmount: client.orders.reduce((sum, o) => sum + (o.lunchboxCount * client.lunchboxPrice) + (o.saladCount * client.saladPrice), 0)
        }
    };
}

// --- 시스템 설정 관련은 src/actions/settings.ts로 이동되었습니다. ---

export async function getKitchenWorkload(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 메뉴 정보 가져오기
    const menu = await prisma.lunchDailyMenu.findUnique({
        where: { date: startOfDay }
    });

    // 모든 주문 가져오기
    const orders = await prisma.lunchOrder.findMany({
        where: {
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: {
            client: true
        }
    });

    const totalLunchbox = orders.reduce((sum, o) => sum + o.lunchboxCount, 0);
    const totalSalad = orders.reduce((sum, o) => sum + o.saladCount, 0);

    return {
        date: startOfDay,
        menu: menu ? {
            lunchbox: JSON.parse(menu.lunchboxLayout),
            salad: JSON.parse(menu.saladLayout)
        } : null,
        total: {
            lunchbox: totalLunchbox,
            salad: totalSalad,
            clientCount: orders.length
        },
        orders: orders.map(o => ({
            id: o.id,
            clientName: o.client.name,
            lunchboxCount: o.lunchboxCount,
            saladCount: o.saladCount,
            memo: o.memo,
            clientMemo: o.client.memo, // 기본 요청사항
            address: o.client.address
        }))
    };
}

export async function getLunchStats() {
    try {
        // 0. 시스템 설정에서 원가 가져오기
        const settings = await (prisma as any).systemSettings.findFirst({ where: { id: 'default' } });
        const lunchboxCost = settings?.defaultLunchboxCost || 0;
        const saladCost = settings?.defaultSaladCost || 0;

        // 최근 30일간의 주문 데이터
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orders = await (prisma as any).lunchOrder.findMany({
            where: {
                date: { gte: thirtyDaysAgo }
            },
            include: {
                client: true
            },
            orderBy: { date: 'asc' }
        });

        // 1. 날짜별 매출 및 수익 추이
        const dailyStats = new Map();
        orders.forEach((o: any) => {
            const dateKey = format(o.date, 'MM/dd');
            const revenue = (o.lunchboxCount * o.client.lunchboxPrice) + (o.saladCount * o.client.saladPrice);
            const cost = (o.lunchboxCount * lunchboxCost) + (o.saladCount * saladCost);
            const profit = revenue - cost;

            const current = dailyStats.get(dateKey) || { revenue: 0, cost: 0, profit: 0, lunchbox: 0, salad: 0 };
            dailyStats.set(dateKey, {
                revenue: current.revenue + revenue,
                cost: current.cost + cost,
                profit: current.profit + profit,
                lunchbox: current.lunchbox + o.lunchboxCount,
                salad: current.salad + o.saladCount
            });
        });

        // 2. 전체 요약
        const totalLunchbox = orders.reduce((sum: number, o: any) => sum + o.lunchboxCount, 0);
        const totalSalad = orders.reduce((sum: number, o: any) => sum + o.saladCount, 0);
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.lunchboxCount * o.client.lunchboxPrice) + (o.saladCount * o.client.saladPrice), 0);
        const totalCost = (totalLunchbox * lunchboxCost) + (totalSalad * saladCost);
        const totalProfit = totalRevenue - totalCost;

        // 3. 상위 고객사 순위
        const clientStats = new Map();
        orders.forEach((o: any) => {
            const revenue = (o.lunchboxCount * o.client.lunchboxPrice) + (o.saladCount * o.client.saladPrice);
            const current = clientStats.get(o.client.name) || 0;
            clientStats.set(o.client.name, current + revenue);
        });

        return {
            dailyTrend: Array.from(dailyStats.entries()).map(([date, data]) => ({ date, ...data })),
            total: {
                revenue: totalRevenue,
                cost: totalCost,
                profit: totalProfit,
                margin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0
            },
            ratio: [
                { name: '도시락', value: totalLunchbox, color: '#f97316' },
                { name: '샐러드', value: totalSalad, color: '#22c55e' }
            ],
            topClients: Array.from(clientStats.entries())
                .map(([name, revenue]) => ({ name, revenue }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
        };
    } catch (error) {
        console.error('getLunchStats Error:', error);
        return null;
    }
}

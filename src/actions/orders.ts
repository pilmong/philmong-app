'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type OrderType = 'RESERVATION' | 'ORDER';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'READY_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED';

export async function getOrders(type?: OrderType) {
    try {
        const orders = await prisma.order.findMany({
            where: type ? { type } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        // Parse items JSON
        return orders.map(order => ({
            ...order,
            items: JSON.parse(order.items),
        }));
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return [];
    }
}

export async function createOrder(data: any) {
    try {
        // Calculate targetDatetime if possible
        let targetDatetime = data.targetDatetime;
        if (!targetDatetime && data.pickupDate && data.pickupTime) {
            try {
                const [hours, minutes] = data.pickupTime.split(':').map(Number);
                const baseDate = new Date(data.pickupDate);
                baseDate.setHours(hours || 12, minutes || 0, 0, 0);
                targetDatetime = baseDate;
            } catch (e) {
                console.error('Failed to parse targetDatetime:', e);
            }
        }

        const order = await prisma.order.create({
            data: {
                ...data,
                type: data.type || 'RESERVATION',
                channel: data.channel || 'TEXT', // Default to TEXT if from parser
                salesType: data.salesType || 'RESERVATION',
                targetDatetime: targetDatetime,
                items: JSON.stringify(data.items),
            },
        });
        revalidatePath('/admin/orders');
        return { success: true, data: order };
    } catch (error) {
        console.error('Failed to create order:', error);
        return { success: false, error: 'Failed to create order' };
    }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
    try {
        await prisma.order.update({
            where: { id },
            data: { status },
        });
        revalidatePath('/admin/orders');
        return { success: true };
    } catch (error) {
        console.error('Failed to update order status:', error);
        return { success: false, error: 'Failed to update order status' };
    }
}

export async function updateOrder(id: string, data: any) {
    try {
        const updateData = { ...data };
        if (data.items) {
            updateData.items = JSON.stringify(data.items);
        }

        const order = await prisma.order.update({
            where: { id },
            data: updateData,
        });
        revalidatePath('/admin/orders');
        return { success: true, data: order };
    } catch (error) {
        console.error('Failed to update order:', error);
        return { success: false, error: 'Failed to update order' };
    }
}

export async function deleteOrder(id: string) {
    try {
        await prisma.order.delete({
            where: { id },
        });
        revalidatePath('/admin/orders');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete order:', error);
        return { success: false, error: 'Failed to delete order' };
    }
}

export async function getGeneralKitchenWorkload() {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['CONFIRMED', 'PREPARING']
                }
            },
            orderBy: { pickupDate: 'asc' }
        });

        const products = await prisma.product.findMany();
        const productMap = new Map(products.map(p => [p.name, p]));

        const items = orders.flatMap(order => {
            const parsedItems = JSON.parse(order.items);
            return parsedItems.map((item: any) => ({
                ...item,
                orderId: order.id,
                customerName: order.customerName,
                pickupTime: order.pickupTime,
                pickupType: order.pickupType,
                status: order.status,
                workType: productMap.get(item.name)?.workType || 'UNKNOWN'
            }));
        });

        return {
            cooking: items.filter((i: any) => i.workType === 'COOKING'),
            subdivision: items.filter((i: any) => i.workType === 'SUBDIVISION'),
            others: items.filter((i: any) => i.workType !== 'COOKING' && i.workType !== 'SUBDIVISION')
        };
    } catch (error) {
        console.error('Failed to fetch general kitchen workload:', error);
        return { cooking: [], subdivision: [], others: [] };
    }
}

import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export async function getGeneralStats() {
    try {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo },
                status: 'COMPLETED'
            },
            orderBy: { createdAt: 'asc' }
        });

        // 1. 일별 매출 추이
        const dailyStats = new Map();
        (orders as any[]).forEach(order => {
            const dateKey = format(order.createdAt, 'MM/dd');
            const current = dailyStats.get(dateKey) || { revenue: 0, count: 0 };
            dailyStats.set(dateKey, {
                revenue: current.revenue + (order.totalPrice || 0),
                count: current.count + 1
            });
        });

        // 2. 채널별 비중
        const channelStats = new Map();
        (orders as any[]).forEach(order => {
            const channel = order.channel || '기타';
            channelStats.set(channel, (channelStats.get(channel) || 0) + 1);
        });

        // 3. 인기 상품 (Top 10)
        const productStats = new Map();
        (orders as any[]).forEach(order => {
            const items = JSON.parse(order.items);
            items.forEach((item: any) => {
                const current = productStats.get(item.name) || { quantity: 0, revenue: 0 };
                productStats.set(item.name, {
                    quantity: current.quantity + item.quantity,
                    revenue: current.revenue + (item.price * item.quantity || 0)
                });
            });
        });

        const topProducts = Array.from(productStats.entries())
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .slice(0, 10)
            .map(([name, stat]) => ({ name, ...stat }));

        return {
            daily: Array.from(dailyStats.entries()).map(([date, stat]) => ({ date, ...stat })),
            channels: Array.from(channelStats.entries()).map(([name, value]) => ({ name, value })),
            products: topProducts,
            summary: {
                totalRevenue: (orders as any[]).reduce((sum, o) => sum + (o.totalPrice || 0), 0),
                totalOrders: orders.length,
                avgOrderValue: orders.length > 0 ? Math.round((orders as any[]).reduce((sum, o) => sum + (o.totalPrice || 0), 0) / orders.length) : 0
            }
        };
    } catch (error) {
        console.error('Failed to fetch general stats:', error);
        return null;
    }
}

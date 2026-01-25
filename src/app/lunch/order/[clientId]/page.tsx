'use server';

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { getLunchDailyMenu } from '@/actions/lunch';
import { ClientOrderForm } from '@/components/lunch/client-order-form';

export default async function LunchClientOrderPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params;

    const client = await prisma.lunchClient.findUnique({
        where: { id: clientId }
    });

    if (!client || client.status === 'INACTIVE') {
        notFound();
    }

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1); // 내일부터 7일간
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const weeklyData = await Promise.all(days.map(async (date) => {
        const dailyMenu = await getLunchDailyMenu(date);
        const order = await prisma.lunchOrder.findUnique({
            where: {
                date_clientId: {
                    date,
                    clientId
                }
            }
        });
        return { date, dailyMenu, order };
    }));

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="mx-auto max-w-3xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{client.name}</h1>
                    <p className="text-slate-500 font-medium">향후 7일간의 런치 납품 수량을 통합 관리합니다</p>
                </div>

                <ClientOrderForm
                    client={client as any}
                    weeklyData={weeklyData as any}
                />

                <div className="text-center text-xs text-slate-400">
                    Philmong Lunch Management System
                </div>
            </div>
        </div>
    );
}

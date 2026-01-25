'use server';

import { getLunchDailyMenu, getLunchOrdersByDate } from '@/actions/lunch';
import { getCurrentUser } from '@/actions/auth';
import { WorkBoard } from '@/components/lunch/work-board';
import { format } from 'date-fns';

export default async function LunchWorkPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const { date } = await searchParams;
    const selectedDate = date ? new Date(date) : new Date();
    const [dailyMenu, orders, user] = await Promise.all([
        getLunchDailyMenu(selectedDate),
        getLunchOrdersByDate(selectedDate),
        getCurrentUser()
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? '오늘의 작업 현황' : `${format(selectedDate, 'MM월 dd일')} 작업 현황`}
                    </h1>
                    <p className="text-muted-foreground">날짜별 제작 수량과 고객사별 배달 상태를 실시간으로 확인합니다.</p>
                </div>
            </div>

            <WorkBoard
                date={selectedDate}
                dailyMenu={dailyMenu as any}
                orders={orders as any}
                user={user as any}
            />
        </div>
    );
}

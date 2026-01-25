

import { getLunchDailyMenu } from '@/actions/lunch';
import { MenuBuilder } from '@/components/lunch/menu-builder';

export default async function LunchMenuPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const { date } = await searchParams;
    const selectedDate = date ? new Date(date) : new Date();
    const dailyMenu = await getLunchDailyMenu(selectedDate);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">런치 메뉴 기획</h1>
                    <p className="text-muted-foreground">날짜별 도시락 구성과 샐러드 재료를 시각적으로 기획합니다.</p>
                </div>
            </div>

            <MenuBuilder initialData={dailyMenu as any} date={selectedDate} />
        </div>
    );
}

import { getUnifiedBusinessStats } from '@/actions/dashboard';
import { UnifiedStatsView } from '@/components/dashboard/unified-stats-view';

export const dynamic = 'force-dynamic';

export default async function UnifiedStatsPage() {
    const data = await getUnifiedBusinessStats();

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="text-4xl">📊</div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">통계 데이터를 불러올 수 없습니다.</h2>
                <p className="text-slate-500">데이터를 분석하는 동안 잠시 기다려 주시거나, 나중에 다시 시도해주세요.</p>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <UnifiedStatsView data={data} />
            </div>
        </div>
    );
}

import { getGeneralStats } from '@/actions/orders';
import { GeneralStatsView } from '@/components/orders/stats-view';

export default async function GeneralStatsPage() {
    const data = await getGeneralStats();

    if (!data) {
        return <div className="p-20 text-center">매출 분석 데이터를 불러올 수 없습니다.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            <div className="mx-auto max-w-7xl">
                <GeneralStatsView data={data} />
            </div>
        </div>
    );
}

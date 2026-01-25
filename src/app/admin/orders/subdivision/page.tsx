import { getGeneralKitchenWorkload } from '@/actions/orders';
import { GeneralSubdivisionView } from '@/components/orders/subdivision-view';

export default async function GeneralSubdivisionPage() {
    const data = await getGeneralKitchenWorkload();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            <div className="mx-auto max-w-7xl">
                <GeneralSubdivisionView data={data} />
            </div>
        </div>
    );
}

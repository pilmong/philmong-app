import { getGeneralKitchenWorkload } from '@/actions/orders';
import { GeneralKitchenView } from '@/components/orders/kitchen-view';

export default async function GeneralKitchenPage() {
    const data = await getGeneralKitchenWorkload();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            <div className="mx-auto max-w-7xl">
                <GeneralKitchenView data={data} />
            </div>
        </div>
    );
}

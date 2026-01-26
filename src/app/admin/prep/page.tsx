import { PrepMasterView } from '@/components/admin/prep-master-view';

export const dynamic = 'force-dynamic';

export default function PrepMasterPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            <div className="mx-auto max-w-7xl">
                <PrepMasterView />
            </div>
        </div>
    );
}

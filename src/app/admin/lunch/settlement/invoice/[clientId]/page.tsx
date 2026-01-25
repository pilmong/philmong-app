import { InvoiceView } from '@/components/lunch/invoice-view';
import { Suspense } from 'react';

export default async function LunchInvoicePage({ params }: { params: { clientId: string } }) {
    const { clientId } = await params;
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InvoiceView clientId={clientId} />
        </Suspense>
    );
}

import { LabelPrintView } from '@/components/lunch/label-print-view';

export default async function LabelPrintPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const { date } = await searchParams;
    const selectedDate = date ? new Date(date) : new Date();

    return (
        <div className="container mx-auto py-8">
            <LabelPrintView date={selectedDate} />
        </div>
    );
}

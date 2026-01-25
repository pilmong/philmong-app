import { KitchenSheetView } from '@/components/lunch/kitchen-sheet';

export default async function KitchenSheetPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const { date } = await searchParams;
    const selectedDate = date ? new Date(date) : new Date();

    return (
        <div className="container mx-auto py-8">
            <KitchenSheetView date={selectedDate} />
        </div>
    );
}

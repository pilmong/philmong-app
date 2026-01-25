import { getOrders } from '@/actions/orders';
import { getProducts } from '@/actions/products';
import { OrderList } from '@/components/orders/order-list';
import Link from 'next/link';
import { ChefHat, TrendingUp, Package } from 'lucide-react';

export default async function OrderManagementPage() {
    // @ts-ignore - Ignoring type mismatch for now, as JSON parsing is handled
    const orders = await getOrders();
    const products = await getProducts();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-wrap gap-4">
                    <Link
                        href="/admin/orders/kitchen"
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-bold shadow-sm hover:bg-orange-700 transition-colors"
                    >
                        <ChefHat className="w-4 h-4" />
                        실시간 조리 현황
                    </Link>
                    <Link
                        href="/admin/orders/subdivision"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm hover:bg-emerald-700 transition-colors"
                    >
                        <Package className="w-4 h-4" />
                        소분 및 포장 현황
                    </Link>
                    <Link
                        href="/admin/orders/stats"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-sm hover:bg-blue-700 transition-colors"
                    >
                        <TrendingUp className="w-4 h-4" />
                        매출 통계 분석
                    </Link>
                </div>
                <OrderList initialOrders={orders as any} products={products} />
            </div>
        </div>
    );
}

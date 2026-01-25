'use client';

import { useState } from 'react';
import { Plus, Search, Filter, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductModal } from '@/components/products/product-modal';
import { deleteProduct, ProductType as ActionProductType } from '@/actions/products';
import { useRouter } from 'next/navigation';

// Define a type compatible with what comes from Prisma but suitable for frontend
interface Product {
    id: string;
    type: string;
    name: string;
    price: number;
    category?: string | null;
    status: string;
    targetDate?: Date | null;
}

interface ProductListProps {
    initialProducts: Product[];
}

export function ProductList({ initialProducts }: ProductListProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<ActionProductType>('REGULAR');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

    // Filter products based on activeTab
    const filteredProducts = initialProducts.filter(p => p.type === activeTab);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            const result = await deleteProduct(id);
            if (result.success) {
                router.refresh();
            } else {
                alert('Failed to delete product');
            }
        }
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedProduct(undefined);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Product Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your menu items and inventory.</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                </button>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-slate-200 dark:border-slate-800">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {(['REGULAR', 'DAILY', 'SPECIAL', 'LUNCHBOX'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={cn(
                                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                                activeTab === type
                                    ? 'border-slate-900 text-slate-900 dark:border-slate-50 dark:text-slate-50'
                                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300'
                            )}
                        >
                            {type === 'REGULAR' && '상시 판매 (Regular)'}
                            {type === 'DAILY' && '매일 변경 (Daily)'}
                            {type === 'SPECIAL' && '특별한 날 (Special)'}
                            {type === 'LUNCHBOX' && '런치 박스 (Lunchbox)'}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Filters & Search - Visual Only for now */}
            <div className="mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-slate-300"
                    />
                </div>
                <button className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </button>
            </div>

            {/* Content Area */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
                {filteredProducts.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto mb-4 h-12 w-12 text-slate-300">
                            <Package className="h-full w-full" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No products found</h3>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">Get started by creating a new product.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-700 dark:bg-slate-900 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Price</th>
                                    {activeTab === 'REGULAR' && <th className="px-6 py-3">Category</th>}
                                    {(activeTab === 'DAILY' || activeTab === 'SPECIAL') && <th className="px-6 py-3">Date</th>}
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{product.name}</td>
                                        <td className="px-6 py-4">{product.price.toLocaleString()}원</td>
                                        {activeTab === 'REGULAR' && <td className="px-6 py-4">{product.category}</td>}
                                        {(activeTab === 'DAILY' || activeTab === 'SPECIAL') && <td className="px-6 py-4">
                                            {product.targetDate ? new Date(product.targetDate).toLocaleDateString() : '-'}
                                        </td>}
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                product.status === 'ACTIVE'
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                                            )}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ProductModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                type={activeTab}
                product={selectedProduct}
                onSuccess={() => {
                    router.refresh();
                }}
            />
        </>
    );
}

import { getProducts } from '@/actions/products';
import { ProductList } from '@/components/products/product-list';

export default async function ProductManagementPage() {
    const products = await getProducts();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            <div className="mx-auto max-w-7xl">
                <ProductList initialProducts={products} />
            </div>
        </div>
    );
}

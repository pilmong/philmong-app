import { getRecentSales, getAllProducts } from "./actions";
import SalesListClient from "@/components/SalesListClient";

export default async function SalesPage() {
    const [sales, products] = await Promise.all([
        getRecentSales(),
        getAllProducts()
    ]);

    return <SalesListClient sales={sales} products={products} />;
}

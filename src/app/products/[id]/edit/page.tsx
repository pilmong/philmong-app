import { prisma } from "@/lib/prisma";
import ProductForm from "../../components/ProductForm";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const product = await prisma.product.findUnique({
        where: { id },
        include: { lunchBoxConfig: true }
    });

    if (!product) notFound();

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">상품 정보 수정</h2>
                <p className="text-slate-500 mt-2">상품 정보를 변경하고 저장 버튼을 눌러주세요.</p>
            </div>

            <ProductForm product={product} />
        </div>
    );
}

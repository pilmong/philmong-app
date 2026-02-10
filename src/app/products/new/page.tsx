import ProductForm from "../components/ProductForm";

export default function NewProductPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">새 상품 등록</h2>
                <p className="text-slate-500 mt-2">등록하려는 상품의 유형을 먼저 선택해 주세요.</p>
            </div>

            <ProductForm />
        </div>
    );
}

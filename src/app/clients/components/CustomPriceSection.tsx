"use client";

import { useState } from "react";
import { setCustomPrice, removeCustomPrice } from "../actions";
import { ProductType } from "@prisma/client";
import { ShoppingBag, Star, Package, Utensils, Search, Check, RotateCcw, Save } from "lucide-react";

interface Product {
    id: string;
    name: string;
    price: number;
    type: ProductType;
}

interface CustomPrice {
    productId: string;
    customPrice: number;
}

export default function CustomPriceSection({
    clientId,
    allProducts,
    initialCustomPrices
}: {
    clientId: string;
    allProducts: Product[];
    initialCustomPrices: CustomPrice[];
}) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<ProductType | 'ALL'>('ALL');

    const filteredProducts = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'ALL' || p.type === activeTab;
        return matchesSearch && matchesTab;
    });

    const getTypeIcon = (type: ProductType) => {
        switch (type) {
            case 'REGULAR': return <ShoppingBag className="w-4 h-4" />;
            case 'DAILY': return <Star className="w-4 h-4" />;
            case 'SPECIAL': return <Package className="w-4 h-4" />;
            case 'LUNCH_BOX': return <Utensils className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    const getTypeLabel = (type: ProductType) => {
        switch (type) {
            case 'REGULAR': return "상시";
            case 'DAILY': return "데일리";
            case 'SPECIAL': return "스페셜";
            case 'LUNCH_BOX': return "도시락";
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 flex items-center">
                            <Star className="w-6 h-6 mr-3 text-amber-400 fill-amber-400" />
                            고객사 맞춤 단가 & 메뉴 공개 관리
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            단가를 설정(저장)한 메뉴만 고객사 발주 센터에 **공개**됩니다.
                            <br />공개하고 싶은 메뉴의 단가를 입력해 주세요. (기본가와 동일해도 저장 시 공개됨)
                        </p>
                    </div>
                </div>

                {/* 필터 및 검색 */}
                <div className="space-y-6">
                    <div className="flex p-1 bg-slate-100 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
                        {(['ALL', 'LUNCH_BOX', 'REGULAR', 'DAILY', 'SPECIAL'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {tab === 'ALL' ? "전체 보기" : getTypeLabel(tab as ProductType)}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="메뉴명을 검색하여 공개 여부를 관리하세요..."
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-700 font-medium focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto p-4 space-y-3 bg-slate-50/50 no-scrollbar">
                {filteredProducts.length === 0 ? (
                    <div className="py-20 text-center text-slate-300 flex flex-col items-center">
                        <Package className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-bold">해당하는 상품이 없습니다.</p>
                    </div>
                ) : (
                    filteredProducts.map((product) => {
                        const customPrice = initialCustomPrices.find(cp => cp.productId === product.id);
                        const isModified = !!customPrice;

                        return (
                            <div key={product.id} className={`group flex items-center justify-between p-4 bg-white rounded-[2rem] border transition-all ${isModified ? 'border-emerald-200 bg-emerald-50/10 shadow-md shadow-emerald-500/5' : 'border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-200 shadow-sm'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isModified ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                                        }`}>
                                        {getTypeIcon(product.type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-800 tracking-tight">{product.name}</span>
                                            {isModified ? (
                                                <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-1">
                                                    <Check className="w-2.5 h-2.5" /> 공개됨
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">비공개</span>
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 italic">기본 단가: {product.price.toLocaleString()}원</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            setIsUpdating(product.id);
                                            const formData = new FormData(e.currentTarget);
                                            const price = parseInt(formData.get("customPrice") as string);
                                            if (!isNaN(price)) {
                                                await setCustomPrice(clientId, product.id, price);
                                            }
                                            setIsUpdating(null);
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            name="customPrice"
                                            type="number"
                                            defaultValue={customPrice?.customPrice || product.price}
                                            className="w-28 h-12 rounded-xl border-2 border-slate-100 px-4 text-sm font-black text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50/50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isUpdating === product.id}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isModified
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-slate-900 text-white hover:bg-slate-800'
                                                } disabled:opacity-50 active:scale-95`}
                                            title="저장"
                                        >
                                            {isUpdating === product.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                                        </button>
                                    </form>

                                    {isModified && (
                                        <button
                                            onClick={async () => {
                                                if (confirm(`${product.name}의 단가를 기본값으로 초기화하시겠습니까?`)) {
                                                    await removeCustomPrice(clientId, product.id);
                                                }
                                            }}
                                            className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center active:scale-95 border border-transparent hover:border-rose-100"
                                            title="초기화"
                                        >
                                            <RotateCcw className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 flex items-center">
                    <Check className="w-4 h-4 mr-1 text-emerald-500" />
                    자동 저장되지 않으니 화살표 버튼을 눌러주세요.
                </p>
                <div className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                    맞춤 설정 {initialCustomPrices.length}개
                </div>
            </div>
        </div>
    );
}

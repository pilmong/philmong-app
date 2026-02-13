"use client";

import { useState, useEffect } from "react";
import { parseOrderText, ParsedSaleData } from "@/lib/order-parser";
import { createSaleWithItems, getAllProducts } from "../actions";
import { useRouter } from "next/navigation";
import {
    Clipboard,
    Save,
    AlertCircle,
    ShoppingCart,
    Truck,
    CreditCard,
    ArrowRight,
    Search,
    CheckCircle2
} from "lucide-react";

export default function NaverImportPage() {
    const router = useRouter();
    const [inputText, setInputText] = useState("");
    const [parsedData, setParsedData] = useState<ParsedSaleData | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [existingProducts, setExistingProducts] = useState<{ id: string, name: string, basePrice: number }[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({}); // originalName -> productId

    // 상품 목록 초기 로드
    useEffect(() => {
        const loadProducts = async () => {
            const products = (await getAllProducts()) as any[];
            setExistingProducts(products);

            // 대시보드 퀵인포트 데이터 확인
            const quickData = localStorage.getItem("quickImportData");
            if (quickData) {
                setInputText(quickData);
                localStorage.removeItem("quickImportData"); // 사용 후 즉시 삭제

                // 주의: existingProducts가 스테이트에 반영된 후에 handleParse를 실행해야 하므로
                // 여기서는 직접 parseOrderText를 호출하거나 간접 트리거 처리
                const result = parseOrderText(quickData, products);
                setParsedData(result);

                // 자동 매칭
                const newMapping: Record<string, string> = {};
                result.items.forEach(item => {
                    const found = products.find(p => p.name === item.name);
                    if (found) newMapping[item.name] = found.id;
                });
                setMapping(newMapping);
            }
        };
        loadProducts();
    }, []);

    const handleParse = () => {
        if (!inputText.trim()) return;

        const result = parseOrderText(inputText, existingProducts);
        setParsedData(result);

        // 자동 매칭 (이름이 정확히 일치하는 경우)
        const newMapping = { ...mapping };
        result.items.forEach(item => {
            const found = existingProducts.find(p => p.name === item.name);
            if (found) {
                newMapping[item.name] = found.id;
            }
        });
        setMapping(newMapping);
    };

    const handleMappingChange = (originalName: string, productId: string) => {
        setMapping(prev => ({ ...prev, [originalName]: productId }));
    };

    const handleSave = async () => {
        if (!parsedData) return;

        // 매칭되지 않은 상품 확인
        const unmapped = parsedData.items.filter(item => !mapping[item.name]);
        if (unmapped.length > 0) {
            alert(`[${unmapped[0].name}] 상품이 시스템에 등록되어 있지 않습니다. 상품을 먼저 등록하거나 매칭해주세요.`);
            return;
        }

        setIsPending(true);
        try {
            await createSaleWithItems({
                customerName: parsedData.customerName,
                customerPhone: parsedData.customerPhone,
                deliveryFee: parsedData.deliveryFee,
                discountValue: parsedData.discountValue,
                totalAmount: parsedData.totalAmount,
                source: "NAVER",
                memo: parsedData.memo,
                utilizationDate: parsedData.utilizationDate,
                items: parsedData.items.map(item => ({
                    productId: mapping[item.name],
                    quantity: item.quantity,
                    price: item.price || existingProducts.find(p => p.id === mapping[item.name])?.basePrice || 0
                    // 파싱된 가격이 있으면 쓰고, 없으면 DB 기본가 사용
                }))
            });
            alert("B2C 주문 정보가 성공적으로 저장되었습니다.");
            router.push("/sales");
        } catch (error) {
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">네이버 예약 스마트 임포트</h1>
                    <p className="text-slate-500 mt-2 text-lg">복사한 예약 텍스트를 붙여넣기만 하세요. 자동으로 분류해 드립니다.</p>
                </div>
                <button
                    onClick={() => router.push("/sales")}
                    className="text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                    목록으로 돌아가기
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* 1. 입력 영역 */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Clipboard className="w-20 h-20 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-3">1</span>
                            예약 정보 붙여넣기
                        </h3>
                        <textarea
                            className="w-full h-80 rounded-3xl border-2 border-slate-100 p-6 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50/50 leading-relaxed font-mono text-sm"
                            placeholder="네이버 예약 정보 페이지에서 전체 내용을 복사하여 여기에 붙여넣으세요..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button
                            onClick={handleParse}
                            className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center"
                        >
                            <Search className="w-5 h-5 mr-2" />
                            지능형 데이터 분석 시작
                        </button>
                    </div>

                    <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center">
                            <CheckCircle2 className="w-5 h-5 mr-2 text-blue-600" />
                            사장님을 위한 팁
                        </h4>
                        <ul className="text-sm text-blue-800/70 space-y-2 list-disc list-inside px-1 leading-relaxed">
                            <li>상품명 뒤에 <b>'N개'</b> 형식이 있으면 자동으로 맛과 수량을 파악합니다.</li>
                            <li><b>'배송비'</b>, <b>'배달'</b> 키워드는 별도 배달료 필드로 자동 이동합니다.</li>
                            <li><b>'쿠폰'</b>, <b>'할인'</b> 항목은 결제 금액에서 자동 차감 관리됩니다.</li>
                        </ul>
                    </div>
                </div>

                {/* 2. 파싱 및 매칭 영역 */}
                <div className="space-y-6">
                    {parsedData ? (
                        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm mr-3">2</span>
                                분석 결과 확인 및 매칭
                            </h3>

                            {/* 고객 정보 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">예약자</div>
                                    <input
                                        type="text"
                                        value={parsedData.customerName || ""}
                                        onChange={(e) => setParsedData({ ...parsedData, customerName: e.target.value })}
                                        className="w-full bg-transparent font-bold text-slate-900 border-none p-0 focus:ring-0"
                                    />
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">연락처</div>
                                    <input
                                        type="text"
                                        value={parsedData.customerPhone || ""}
                                        onChange={(e) => setParsedData({ ...parsedData, customerPhone: e.target.value })}
                                        className="w-full bg-transparent font-bold text-slate-900 border-none p-0 focus:ring-0"
                                    />
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">이용일시</div>
                                    <input
                                        type="text"
                                        value={parsedData.utilizationDate || ""}
                                        onChange={(e) => setParsedData({ ...parsedData, utilizationDate: e.target.value })}
                                        className="w-full bg-transparent font-bold text-slate-900 border-none p-0 focus:ring-0"
                                        placeholder="파싱된 이용일시"
                                    />
                                </div>
                            </div>

                            {/* 아이템 매칭 테이블 */}
                            <div className="space-y-4 mb-8">
                                <div className="text-sm font-bold text-slate-500 flex items-center px-2">
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    주문 상품 ({parsedData.items.length})
                                </div>
                                {parsedData.items.map((item, idx) => (
                                    <div key={idx} className="flex flex-col space-y-2 p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700">{item.name} <span className="text-blue-600 ml-1">x{item.quantity}</span></span>
                                            <span className="text-sm font-mono text-slate-500">{item.price.toLocaleString()}원</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <ArrowRight className="w-4 h-4 text-slate-300" />
                                            <select
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                value={mapping[item.name] || ""}
                                                onChange={(e) => handleMappingChange(item.name, e.target.value)}
                                            >
                                                <option value="">상품 선택 (필수)</option>
                                                {existingProducts.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 금액 요약 */}
                            <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-3">
                                <div className="flex justify-between items-center opacity-60 text-sm">
                                    <div className="flex items-center"><Truck className="w-4 h-4 mr-2" /> 배달료</div>
                                    <div>{parsedData.deliveryFee.toLocaleString()}원</div>
                                </div>
                                <div className="flex justify-between items-center opacity-60 text-sm">
                                    <div className="flex items-center"><CreditCard className="w-4 h-4 mr-2" /> 할인 금액</div>
                                    <div className="text-rose-400">-{parsedData.discountValue.toLocaleString()}원</div>
                                </div>
                                <div className="h-px bg-white/10 my-1" />
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <div>최종 결제액</div>
                                    <div className="text-emerald-400">{parsedData.totalAmount.toLocaleString()}원</div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="w-full mt-8 py-5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center shadow-lg shadow-blue-500/30 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5 mr-3" />
                                {isPending ? "데이터 저장 중..." : "위 내용으로 주문 확정 및 저장"}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
                            <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-bold text-lg">아직 분석된 데이터가 없습니다.</p>
                            <p className="text-sm mt-2 leading-relaxed">왼쪽 칸에 네이버 예약 정보를 입력하고<br />분석 버튼을 눌러주세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

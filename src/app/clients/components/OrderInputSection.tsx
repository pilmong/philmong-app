"use client";

import { useState } from "react";
import { upsertOrderRequest } from "../order-actions";
import { ShoppingBasket, Calendar, Plus, Minus, Clock, AlertCircle, Info, Check } from "lucide-react";

interface Product {
    id: string;
    name: string;
    sellingDate: Date;
    lunchBoxConfig: any;
}

interface OrderItem {
    productId?: string | null;
    itemName?: string | null;
    itemCategory?: string | null;
    quantity: number;
    date: string;
}

export default function OrderInputSection({
    clientId,
    isAdmin = false,
    deadlineHour,
    products,
    initialOrders
}: {
    clientId: string;
    isAdmin?: boolean;
    deadlineHour: number;
    products: Product[];
    initialOrders: OrderItem[];
}) {
    const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 날짜 포맷 헬퍼 (로컬 시간 기준 YYYY-MM-DD)
    const getLocalDateString = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // 날짜 목록 생성 (내일부터 향후 14일)
    const dates = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1); // 0이 내일이 되도록 +1
        return getLocalDateString(d);
    });

    const handleUpdateQuantity = async (
        date: string,
        category: 'LUNCH_BOX' | 'SALAD',
        quantity: number,
        product?: Product
    ) => {
        setError(null);
        const uniqueKey = `${date}-${category}`;
        setIsSaving(uniqueKey);

        const result = await upsertOrderRequest(clientId, date, quantity, {
            productId: product?.id,
            itemCategory: category,
            itemName: category === 'LUNCH_BOX' ? '도시락(6칸)' : '샐러드(3x3)',
            isAdmin // 컴포넌트로 전달받은 isAdmin 사용
        });

        if (result.success) {
            setOrders(prev => {
                const existingIndex = prev.findIndex(o =>
                    o.date === date &&
                    (o.itemCategory === category || (product && o.productId === product.id))
                );

                if (existingIndex > -1) {
                    if (quantity <= 0) return prev.filter((_, i) => i !== existingIndex);
                    const newOrders = [...prev];
                    newOrders[existingIndex] = {
                        ...newOrders[existingIndex],
                        quantity,
                        productId: product?.id,
                        itemCategory: category
                    };
                    return newOrders;
                } else if (quantity > 0) {
                    return [...prev, {
                        date,
                        quantity,
                        productId: product?.id,
                        itemCategory: category,
                        itemName: category === 'LUNCH_BOX' ? '도시락(6칸)' : '샐러드(3x3)'
                    }];
                }
                return prev;
            });
        } else if (result.error) {
            setError(result.error);
        }
        setIsSaving(null);
    };

    /**
     * 마감 시간 경과 여부 확인
     * @param dateStr 발주 대상 날짜
     */
    const isDeadlinePassed = (dateStr: string) => {
        // 관리자 모드인 경우 마감 체크를 무시하고 항상 수정 가능하게 함
        if (isAdmin) return false;

        const now = new Date();
        const todayStr = getLocalDateString(now);

        // 내일 날짜 계산
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = getLocalDateString(tomorrow);

        // 1. 이미 지난 날짜인 경우
        if (dateStr <= todayStr) return true;

        // 2. 내일 발주인 경우, 오늘 마감 시간 체크
        if (dateStr === tomorrowStr) {
            return now.getHours() >= deadlineHour;
        }

        // 3. 모레 이후인 경우 아직 마감 전
        return false;
    };

    return (
        <div className="space-y-12">
            {isAdmin && (
                <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between border-4 border-blue-500 animate-pulse ring-8 ring-blue-500/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight">관리자 수정 모드 활성화</h3>
                            <p className="text-blue-300 text-sm font-bold mt-0.5">마감 시간과 관계없이 모든 수량을 수정할 수 있는 특수 권한 모드입니다.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-[2.5rem] shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                    <Clock className="text-white w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-amber-900 font-black text-lg">발주 마감 안내</h3>
                    <p className="text-amber-800 text-sm mt-1 font-medium leading-relaxed">
                        신선한 식재료 준비를 위해 **배송 전날 오후 {deadlineHour}시**에 발주가 마감됩니다.
                        <br />당일 발주는 시스템상 불가하오니 급한 용무는 고객센터로 연락 부탁드립니다.
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border-l-4 border-rose-400 p-4 rounded-r-2xl flex items-center gap-3 animate-bounce sticky top-4 z-50 shadow-lg">
                    <AlertCircle className="text-rose-500 w-5 h-5 shrink-0" />
                    <p className="text-rose-800 font-bold text-sm">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-10">
                {dates.map((dateStr) => {
                    const dateObj = new Date(dateStr);
                    const isPassed = isDeadlinePassed(dateStr);

                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const isClosedSoon = !isPassed && dateStr === getLocalDateString(tomorrow);

                    const dayProducts = products.filter(p => {
                        const pDate = new Date(p.sellingDate);
                        return getLocalDateString(pDate) === dateStr;
                    });

                    const categories = [
                        { id: 'LUNCH_BOX', label: '정기 도시락 (6칸)', icon: '🍱' },
                        { id: 'SALAD', label: '프리미엄 샐러드 (탭 UI)', icon: '🥗' }
                    ];

                    return (
                        <div key={dateStr} className={`bg-white rounded-[3rem] border shadow-sm overflow-hidden ${isPassed ? 'opacity-75 grayscale-[0.3]' : 'border-slate-100 hover:shadow-xl transition-shadow'}`}>
                            <div className={`px-8 py-5 flex justify-between items-center ${isPassed ? 'bg-slate-200 text-slate-500' : isClosedSoon ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white'}`}>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 opacity-70" />
                                    <span className="text-xl font-black">
                                        {dateObj.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                                    </span>
                                </div>
                                {isPassed ? (
                                    <div className="flex items-center gap-2 bg-slate-900/10 px-3 py-1 rounded-full text-xs font-bold">
                                        <Clock className="w-3 h-3" />
                                        발주 마감
                                    </div>
                                ) : isClosedSoon && (
                                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                        <Clock className="w-3 h-3" />
                                        내일 배송 (오늘 {deadlineHour}시 마감)
                                    </div>
                                )}
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {categories.map((cat) => {
                                    const product = dayProducts.find(p => p.lunchBoxConfig?.layoutType === cat.id);
                                    const currentOrder = orders.find(o =>
                                        o.date === dateStr &&
                                        (o.itemCategory === cat.id || (product && o.productId === product.id))
                                    );
                                    const quantity = currentOrder?.quantity || 0;
                                    const key = `${dateStr}-${cat.id}`;

                                    return (
                                        <div key={cat.id} className="relative group/box">
                                            <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${quantity > 0 ? 'border-blue-500 bg-blue-50/10' : 'border-slate-50 bg-slate-50/30'}`}>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-2xl">{cat.icon}</span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{cat.label}</span>
                                                        </div>
                                                        <h4 className={`text-xl font-black ${quantity > 0 ? 'text-blue-700' : 'text-slate-900'}`}>
                                                            {product ? product.name : "메뉴 준비 중"}
                                                        </h4>
                                                    </div>
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${quantity > 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                                                        <ShoppingBasket className="w-6 h-6" />
                                                    </div>
                                                </div>

                                                {/* 실물 도면 요약 표시 */}
                                                {product && (
                                                    <div className="mb-6 group-hover/box:scale-[1.02] transition-transform">
                                                        {product.lunchBoxConfig?.layoutType === 'SALAD' ? (
                                                            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 shadow-inner overflow-hidden relative">
                                                                <div className="absolute top-0 right-0 p-2 opacity-20">
                                                                    <Info className="w-3 h-3 text-emerald-400" />
                                                                </div>
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <span className="text-[8px] font-black text-emerald-400 tracking-widest uppercase opacity-70">Salad 3-Layer Specs</span>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-1">
                                                                    {[
                                                                        ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA'],
                                                                        ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
                                                                        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
                                                                    ].map((layer, lIdx) => (
                                                                        <div key={lIdx} className="grid grid-cols-9 gap-0.5 h-2.5">
                                                                            {layer.map(slot => (
                                                                                <div
                                                                                    key={slot}
                                                                                    className={`rounded-[1px] ${product.lunchBoxConfig?.[`slot${slot}`] ? 'bg-emerald-500' : 'bg-slate-700/50'}`}
                                                                                    title={product.lunchBoxConfig?.[`slot${slot}`] || ""}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-inner flex flex-col gap-2">
                                                                <div className="grid grid-cols-4 gap-1">
                                                                    {['C', 'D', 'E', 'F'].map(s => (
                                                                        <div key={s} className={`h-8 rounded-lg flex items-center justify-center border ${s === 'D' ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-white'} overflow-hidden`}>
                                                                            <span className={`text-[8px] font-black ${s === 'D' ? 'text-amber-600' : 'text-slate-400'} truncate px-1`}>{product.lunchBoxConfig?.[`slot${s}`] || "-"}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-1.5 h-8">
                                                                    <div className="bg-white rounded-lg border-l-4 border-slate-200 flex items-center justify-center px-1 overflow-hidden shadow-sm">
                                                                        <span className="text-[9px] font-black text-slate-600 truncate">{product.lunchBoxConfig?.slotA || "Rice"}</span>
                                                                    </div>
                                                                    <div className="bg-white rounded-full border-2 border-slate-50 flex items-center justify-center px-1 overflow-hidden shadow-sm aspect-square mx-auto">
                                                                        <span className="text-[8px] font-black text-slate-600 truncate">{product.lunchBoxConfig?.slotB || "Soup"}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4">
                                                    <button
                                                        disabled={isPassed || quantity <= 0}
                                                        onClick={() => handleUpdateQuantity(dateStr, cat.id as any, quantity - 1, product)}
                                                        className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
                                                    >
                                                        <Minus className="w-5 h-5 text-slate-600" />
                                                    </button>

                                                    <div className="flex-1 text-center bg-white rounded-xl border border-slate-200 py-1.5 shadow-inner relative overflow-hidden group/input">
                                                        {isSaving === key ? (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                            </div>
                                                        ) : null}
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={quantity}
                                                            disabled={isPassed || isSaving === key}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (!isNaN(val)) {
                                                                    setOrders(prev => {
                                                                        const existingIndex = prev.findIndex(o =>
                                                                            o.date === dateStr &&
                                                                            (o.itemCategory === cat.id || (product && o.productId === product.id))
                                                                        );
                                                                        if (existingIndex > -1) {
                                                                            const newOrders = [...prev];
                                                                            newOrders[existingIndex] = { ...newOrders[existingIndex], quantity: val };
                                                                            return newOrders;
                                                                        } else {
                                                                            return [...prev, {
                                                                                date: dateStr,
                                                                                quantity: val,
                                                                                productId: product?.id,
                                                                                itemCategory: cat.id,
                                                                                itemName: cat.id === 'LUNCH_BOX' ? '도시락(6칸)' : '샐러드(3x3)'
                                                                            }];
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (!isNaN(val) && val !== (currentOrder?.quantity || 0)) {
                                                                    handleUpdateQuantity(dateStr, cat.id as any, val, product);
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.currentTarget.blur();
                                                                }
                                                            }}
                                                            className="w-full bg-transparent border-none text-center text-2xl font-black text-slate-900 focus:ring-0 p-0 selection:bg-blue-100"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-400 absolute bottom-1 right-2 pointer-events-none group-focus-within/input:opacity-0 transition-opacity">개</span>
                                                    </div>

                                                    <button
                                                        disabled={isPassed}
                                                        onClick={() => handleUpdateQuantity(dateStr, cat.id as any, quantity + 1, product)}
                                                        className="w-12 h-12 rounded-xl bg-slate-900 text-white shadow-md flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

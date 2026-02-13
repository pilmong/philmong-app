"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSaleWithItems, getAllProducts, getDeliveryZones } from "@/app/sales/actions";
import Script from "next/script";
import { toast } from "sonner";
import {
    User, Phone, MapPin, Calendar, CreditCard,
    MessageSquare, Receipt, Save, X, Plus, Trash2,
    ArrowLeft, ShoppingBag, Truck, Bike, Sparkles, Search
} from "lucide-react";

export default function ManualSalePage() {
    const router = useRouter();
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [deliveryZones, setDeliveryZones] = useState<any[]>([]); // 추가
    const [isSaving, setIsSaving] = useState(false);
    const [lastMatchedZone, setLastMatchedZone] = useState("");

    const [formData, setFormData] = useState({
        customerName: "",
        customerPhone: "",
        deliveryFee: 0,
        discountValue: 0,
        memo: "",
        deliveryZone: "",
        address: "",
        pickupType: "PICKUP" as "PICKUP" | "DELIVERY",
        paymentStatus: "입금대기",
        utilizationDate: "",
        requestNote: "",
        visitor: "",
    });

    const [items, setItems] = useState<any[]>([
        { id: Math.random().toString(), productId: "", customName: "", quantity: 1, price: 0 }
    ]);

    useEffect(() => {
        getAllProducts().then(setAllProducts);
        getDeliveryZones().then(setDeliveryZones);
    }, []);

    const handleAddressSearch = () => {
        if (!(window as any).daum) {
            toast.error("주소 서비스 로드 중... 잠시 후 다시 시도해주세요.");
            return;
        }
        new (window as any).daum.Postcode({
            oncomplete: function (data: any) {
                let fullAddr = data.address;
                let extraAddr = "";

                if (data.addressType === "R") {
                    if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) {
                        extraAddr += data.bname;
                    }
                    if (data.buildingName !== "" && data.apartment === "Y") {
                        extraAddr += (extraAddr !== "" ? ", " + data.buildingName : data.buildingName);
                    }
                    fullAddr += extraAddr !== "" ? ` (${extraAddr})` : "";
                }

                setFormData((prev: any) => ({
                    ...prev,
                    address: fullAddr,
                }));
            },
        }).open();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "deliveryFee" || name === "discountValue" ? Number(value) : value
        }));
    };

    // 주소 기반 배달 구역 자동 매칭 (공용 DeliveryZone 테이블 사용)
    useEffect(() => {
        if (!formData.address) return;

        const matchedZone = deliveryZones.find(zone =>
            zone.areas?.some((area: string) =>
                formData.address.replace(/\s+/g, '').includes(area.replace(/\s+/g, ''))
            )
        );

        if (matchedZone && matchedZone.name !== lastMatchedZone) {
            setFormData(prev => ({
                ...prev,
                pickupType: "DELIVERY",
                deliveryZone: matchedZone.name,
                deliveryFee: matchedZone.price
            }));
            setLastMatchedZone(matchedZone.name);
            toast.success(`${matchedZone.name} 자동 매칭 완료!`, {
                description: `배달비 ${matchedZone.price.toLocaleString()}원이 적용되었습니다.`,
                icon: "🚚"
            });
        }
    }, [formData.address, deliveryZones, lastMatchedZone]);

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(), productId: "", customName: "", quantity: 1, price: 0 }]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) {
            setItems([{ id: Math.random().toString(), productId: "", customName: "", quantity: 1, price: 0 }]);
            return;
        }
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === "productId") {
                    const product = allProducts.find(p => p.id === value);
                    if (product) {
                        updated.price = product.basePrice || 0;
                        updated.customName = "";
                    }
                }
                return updated;
            }
            return item;
        }));
    };

    const itemsTotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const product = allProducts.find(p => p.id === item.productId);
            // DISCOUNT 타입이면 금액을 차감, 그 외에는 합산
            const isDiscount = product?.type === 'DISCOUNT' || item.productId === 'CUSTOM' && /할인|쿠폰/i.test(item.customName);
            const amount = item.price * item.quantity;
            return isDiscount ? sum - amount : sum + amount;
        }, 0);
    }, [items, allProducts]);

    const totalAmount = itemsTotal + formData.deliveryFee - formData.discountValue;

    const handleSave = async () => {
        if (!formData.customerName) {
            alert("고객명을 입력해주세요.");
            return;
        }

        const validItems = items.filter(it => it.productId || it.customName);
        if (validItems.length === 0) {
            alert("최소 하나 이상의 품목을 입력해주세요.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await createSaleWithItems({
                ...formData,
                source: "MANUAL",
                totalAmount,
                items: validItems.map(it => ({
                    productId: (it.productId && it.productId !== "CUSTOM") ? it.productId : undefined,
                    customName: it.productId === "CUSTOM" ? it.customName : (it.productId ? undefined : it.customName),
                    quantity: it.quantity,
                    price: it.price
                }))
            });

            if (res.success) {
                router.push("/sales");
            }
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-all mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" /> 리스트로 돌아가기
                        </button>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Sparkles className="w-10 h-10 text-indigo-600" />
                            수기 주문 직접 등록 ✍️
                        </h1>
                        <p className="text-slate-500 font-bold mt-2 ml-1">전화나 현장 주문을 직접 전표로 생성하세요.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-10 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-3"
                        >
                            <Save className="w-6 h-6" />
                            {isSaving ? "처리 중..." : "전표 저장하기"}
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* 왼쪽: 고객 및 배송 정보 */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-8 space-y-8">
                            {/* 고객 정보 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-indigo-600">
                                    <User className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-widest">Customer Info</span>
                                </div>
                                <div className="grid gap-3">
                                    <input
                                        name="customerName"
                                        placeholder="보내는 분 / 고객 성함"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-base focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                    />
                                    <input
                                        name="customerPhone"
                                        placeholder="연락처 (010-0000-0000)"
                                        value={formData.customerPhone}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-base focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* 배송/이용 정보 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-rose-500">
                                    <MapPin className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-widest">Delivery / Date</span>
                                </div>
                                <div className="grid gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 ml-2">이용 일시</label>
                                        <input
                                            name="utilizationDate"
                                            placeholder="예: 2/15 14:00"
                                            value={formData.utilizationDate}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-base focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-black text-slate-400 ml-2">주소</label>
                                            <button
                                                type="button"
                                                onClick={handleAddressSearch}
                                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg transition-all"
                                            >
                                                <Search className="w-2.5 h-2.5" /> 주소 검색
                                            </button>
                                        </div>
                                        <textarea
                                            name="address"
                                            rows={2}
                                            placeholder="배송 주소 (방문 시 비워두기)"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-base focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 ml-2">구역</label>
                                            <input
                                                name="deliveryZone"
                                                placeholder="Zone A"
                                                value={formData.deliveryZone}
                                                onChange={handleChange}
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-base focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                        <div className="w-32 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 ml-2">구분</label>
                                            <select
                                                name="pickupType"
                                                value={formData.pickupType}
                                                onChange={handleChange}
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-4 font-bold text-base focus:border-indigo-500 focus:bg-white outline-none transition-all appearance-none"
                                            >
                                                <option value="PICKUP">방문</option>
                                                <option value="DELIVERY">배송</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 비용 정보 */}
                        <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-indigo-200">
                            <div className="flex items-center gap-2 opacity-60">
                                <CreditCard className="w-5 h-5" />
                                <span className="text-xs font-black uppercase tracking-widest">Summary</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-indigo-300 ml-2">배달비 (+)</label>
                                    <input
                                        type="number"
                                        name="deliveryFee"
                                        value={formData.deliveryFee}
                                        onChange={handleChange}
                                        className="w-full bg-white/10 border-2 border-white/10 rounded-2xl px-5 py-4 font-black text-xl text-right focus:border-white focus:bg-white/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-rose-300 ml-2">할인액 (-)</label>
                                    <input
                                        type="number"
                                        name="discountValue"
                                        value={formData.discountValue}
                                        onChange={handleChange}
                                        className="w-full bg-white/10 border-2 border-white/10 rounded-2xl px-5 py-4 font-black text-xl text-right focus:border-white focus:bg-white/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/20">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-indigo-200 font-bold">합계</span>
                                    <div className="text-right">
                                        <div className="text-4xl font-black">{totalAmount.toLocaleString()}원</div>
                                        <div className="text-xs text-indigo-300 mt-1">품목 합계: {itemsTotal.toLocaleString()}원</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 품목 등록 */}
                    <div className="lg:col-span-8 flex flex-col h-full">
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col min-h-[600px]">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-[2.5rem]">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                                        <ShoppingBag className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">품목 선택 및 구성</h3>
                                        <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-tighter italic">Selection List</p>
                                    </div>
                                </div>
                                <button
                                    onClick={addItem}
                                    className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <Plus className="w-5 h-5" /> 품목 추가
                                </button>
                            </div>

                            <div className="flex-1 p-8 overflow-y-auto space-y-4 custom-scrollbar">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group flex flex-col md:flex-row gap-4 p-6 rounded-3xl bg-slate-50/50 border-2 border-transparent hover:border-indigo-100 hover:bg-white transition-all items-end md:items-center"
                                    >
                                        <div className="w-full md:flex-1 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Product Name</label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={item.productId}
                                                    onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                                                    className="flex-1 h-14 bg-white border-2 border-slate-100 rounded-2xl px-4 font-bold text-base focus:border-indigo-500 outline-none transition-all shadow-sm appearance-none"
                                                >
                                                    <option value="">상품 선택...</option>

                                                    {/* 일반 상품 그룹 */}
                                                    <optgroup label="📦 일반 상품">
                                                        {allProducts.filter(p => !['ZONE', 'DISCOUNT'].includes(p.type)).map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} ({(p.basePrice || 0).toLocaleString()}원)</option>
                                                        ))}
                                                    </optgroup>

                                                    {/* 배달 구역/비용 그룹 */}
                                                    <optgroup label="🚚 배달 구역/비용">
                                                        {allProducts.filter(p => p.type === 'ZONE').map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} ({(p.basePrice || 0).toLocaleString()}원)</option>
                                                        ))}
                                                    </optgroup>

                                                    {/* 쿠폰/할인 그룹 */}
                                                    <optgroup label="🎁 쿠폰/할인">
                                                        {allProducts.filter(p => p.type === 'DISCOUNT').map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} (-{(p.basePrice || 0).toLocaleString()}원)</option>
                                                        ))}
                                                    </optgroup>

                                                    <option value="CUSTOM">직접 입력...</option>
                                                </select>
                                                {item.productId === "CUSTOM" && (
                                                    <input
                                                        placeholder="나머지 품목명 입력"
                                                        value={item.customName}
                                                        onChange={(e) => updateItem(item.id, "customName", e.target.value)}
                                                        className="flex-1 h-14 bg-white border-2 border-indigo-500 rounded-2xl px-4 font-bold text-base outline-none shadow-sm"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-32 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Qty</label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                                                className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl px-4 font-black text-center text-lg focus:border-indigo-500 outline-none transition-all shadow-sm"
                                            />
                                        </div>

                                        <div className="w-48 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Unit Price</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => updateItem(item.id, "price", Number(e.target.value))}
                                                    className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl px-4 font-black text-right text-lg focus:border-indigo-500 outline-none transition-all shadow-sm pr-10"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">원</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="h-14 w-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-200 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all shrink-0"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}

                                {items.length === 0 && (
                                    <div className="h-40 flex flex-col items-center justify-center text-slate-300 italic">
                                        품목이 없습니다. 오른쪽 위의 버튼을 눌러 추가하세요.
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-slate-50/50 rounded-b-[2.5rem] border-t border-slate-100 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <MessageSquare className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">Internal Memo / Request</span>
                                    </div>
                                    <textarea
                                        name="requestNote"
                                        rows={2}
                                        placeholder="주문 전표에는 나오지 않는 관리자용 메모..."
                                        value={formData.requestNote}
                                        onChange={handleChange}
                                        className="w-full bg-white border-2 border-transparent rounded-[2rem] px-6 py-4 font-bold text-base focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        name="paymentStatus"
                                        placeholder="결제 상태 (예: 카드결제, 입금확인)"
                                        value={formData.paymentStatus}
                                        onChange={handleChange}
                                        className="w-full h-14 bg-white border-2 border-transparent rounded-2xl px-10 py-4 font-bold text-base focus:border-indigo-500 outline-none shadow-sm"
                                    />
                                    <div className="flex items-center justify-center gap-2 p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-100 text-indigo-600">
                                        <Receipt className="w-5 h-5" />
                                        <span className="text-sm font-black">전표 총액: {totalAmount.toLocaleString()}원</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
        </div>
    );
}

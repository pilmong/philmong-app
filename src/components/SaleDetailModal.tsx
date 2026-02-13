"use client";

import { format } from "date-fns";
import { useState } from "react";
import { updateSale } from "@/app/sales/actions";
import { User, Phone, MapPin, Bike, CreditCard, Calendar, MessageSquare, Receipt, Save, X, Printer } from "lucide-react";

interface SaleDetailModalProps {
    sale: any;
    products: any[];
    onClose: () => void;
}

export default function SaleDetailModal({ sale, products, onClose }: SaleDetailModalProps) {
    const [formData, setFormData] = useState({
        customerName: sale.customerName || "",
        customerPhone: sale.customerPhone || "",
        deliveryFee: sale.deliveryFee || 0,
        discountValue: sale.discountValue || 0,
        memo: sale.memo || "",
        deliveryZone: sale.deliveryZone || "",
        reservationNumber: sale.reservationNumber || "",
        address: sale.address || "",
        pickupType: sale.pickupType || "PICKUP",
        paymentStatus: sale.paymentStatus || "",
        utilizationDate: sale.utilizationDate ? format(new Date(sale.utilizationDate), "yyyy-MM-dd HH:mm") : "",
        requestNote: sale.requestNote || "",
        visitor: sale.visitor || "",
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "deliveryFee" || name === "discountValue" ? Number(value) : value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSale(sale.id, formData);
            alert("주문 정보가 수정되었습니다.");
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const totalAmount = (sale.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)) + Number(formData.deliveryFee) - Number(formData.discountValue);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md print:bg-white print:static print:block overflow-hidden">
            <div className="bg-white w-full max-w-5xl mx-auto rounded-[3rem] shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none flex flex-col md:flex-row max-h-[90vh] min-h-0 border border-white/20">

                {/* --- 왼쪽: 정보 수정 영역 (인쇄 시 숨김) --- */}
                <div className="w-full md:w-[400px] bg-slate-50 flex flex-col border-r border-slate-200 print:hidden min-h-0 overflow-hidden">
                    <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-indigo-400" />
                            <h2 className="font-black text-lg tracking-tight">상세 정보 고치기</h2>
                        </div>
                        <button onClick={onClose} className="hover:rotate-90 transition-transform p-1">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 overscroll-contain">
                        {/* 기본 필수 정보 */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <User className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-widest">Customer</span>
                            </div>
                            <div className="grid gap-3">
                                <input
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    placeholder="고객명"
                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-sm focus:border-indigo-500 outline-none transition-all shadow-sm"
                                />
                                <input
                                    name="customerPhone"
                                    value={formData.customerPhone}
                                    onChange={handleChange}
                                    placeholder="연락처"
                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-sm focus:border-indigo-500 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* 장소 및 시간 */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-rose-500">
                                <MapPin className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-widest">Logistics</span>
                            </div>
                            <div className="grid gap-3">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 ml-2">이용 일시</span>
                                    <input
                                        name="utilizationDate"
                                        value={formData.utilizationDate}
                                        onChange={handleChange}
                                        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-mono font-bold text-sm focus:border-indigo-500 outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 ml-2">배송 주소</span>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-sm focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 ml-2">배달 구역</span>
                                        <input
                                            name="deliveryZone"
                                            value={formData.deliveryZone}
                                            onChange={handleChange}
                                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-sm focus:border-indigo-500 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="w-32 space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 ml-2">구분</span>
                                        <select
                                            name="pickupType"
                                            value={formData.pickupType}
                                            onChange={handleChange}
                                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-3 py-3 font-bold text-sm focus:border-indigo-500 outline-none transition-all appearance-none shadow-sm"
                                        >
                                            <option value="PICKUP">방문</option>
                                            <option value="DELIVERY">배달</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 결제 및 정산 */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-600">
                                <CreditCard className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-widest">Payment</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 ml-2">배달비</span>
                                    <input
                                        type="number"
                                        name="deliveryFee"
                                        value={formData.deliveryFee}
                                        onChange={handleChange}
                                        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-black text-sm text-right focus:border-indigo-500 outline-none shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-rose-400 ml-2">할인액</span>
                                    <input
                                        type="number"
                                        name="discountValue"
                                        value={formData.discountValue}
                                        onChange={handleChange}
                                        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-black text-sm text-right focus:border-indigo-500 outline-none shadow-sm"
                                    />
                                </div>
                            </div>
                            <input
                                name="paymentStatus"
                                value={formData.paymentStatus}
                                onChange={handleChange}
                                placeholder="입금 여부 (예: 입금완료)"
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-sm focus:border-indigo-500 shadow-sm outline-none"
                            />
                        </div>

                        {/* 요청사항 */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-widest">Note</span>
                            </div>
                            <textarea
                                name="requestNote"
                                value={formData.requestNote}
                                onChange={handleChange}
                                rows={2}
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-sm focus:border-indigo-500 outline-none resize-none shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-white border-t border-slate-200 shrink-0">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? "저장 중..." : "변경 내용 저장"}
                        </button>
                    </div>
                </div>

                {/* --- 오른쪽: 전표 미리보기 --- */}
                <div className="flex-1 bg-slate-100 flex flex-col h-full min-h-0 overflow-hidden relative">
                    <div className="absolute top-8 right-8 z-10 print:hidden flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-base font-black hover:bg-slate-800 transition-all shadow-2xl active:scale-95 flex items-center gap-2"
                        >
                            <Printer className="w-5 h-5" />
                            이 전표 출력하기
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 md:p-20 print:p-0 print:overflow-visible overscroll-contain flex flex-col items-center">
                        <div className="w-[420px] bg-white rounded-[4rem] shadow-2xl border-[12px] border-white overflow-hidden font-mono print:shadow-none print:w-full print:max-w-none print:rounded-none flex flex-col shrink-0">
                            <div className="h-6 bg-indigo-600 w-full shrink-0"></div>

                            <div className="p-12 space-y-10 flex-1 flex flex-col">
                                <div className="text-center border-b-2 border-slate-50 pb-8">
                                    <div className="flex items-center justify-center gap-3 mb-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${sale.source === 'NAVER' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                            {sale.source}
                                        </span>
                                        <span className="text-xs font-black text-slate-300 tracking-tighter italic">#{sale.id.slice(-8).toUpperCase()}</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                            {formData.customerName || "미입력"}
                                        </span>
                                        <span className="text-xl font-black text-indigo-500 tracking-tight">
                                            {formData.customerPhone || "-"}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Utilization Date</div>
                                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                                            {formData.utilizationDate || "시간 미정"}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Address / Pickup</div>
                                        <div className="text-2xl font-black leading-tight text-slate-900 break-keep">
                                            {formData.address || "현장 방문 수령"}
                                        </div>
                                        {formData.deliveryZone && (
                                            <div className="inline-flex items-center gap-1.5 mt-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-black border border-indigo-100">
                                                <Bike className="w-3.5 h-3.5" /> {formData.deliveryZone}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div className="flex justify-between items-center border-b border-slate-900/10 pb-2">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Item Description</span>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Qty</span>
                                    </div>
                                    <div className="space-y-4">
                                        {sale.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="text-lg font-black text-slate-800 leading-snug">
                                                        {item.product?.name || item.customName || "품목명"}
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-400 mt-0.5">
                                                        {(item.price * item.quantity).toLocaleString()}원
                                                    </div>
                                                </div>
                                                <span className="text-lg font-black text-slate-900 shrink-0">
                                                    x{item.quantity}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 border-t-2 border-slate-100 border-dotted space-y-3">
                                    <div className="flex justify-between text-xs font-black text-slate-400 uppercase">
                                        <span>배달비 {formData.deliveryZone && `(${formData.deliveryZone})`}</span>
                                        <span className="text-slate-600">+{formData.deliveryFee.toLocaleString()}원</span>
                                    </div>
                                    {formData.discountValue > 0 && (
                                        <div className="flex justify-between text-xs font-black text-rose-400 uppercase">
                                            <span>프로모션 할인</span>
                                            <span>-{formData.discountValue.toLocaleString()}원</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-baseline pt-6 border-t border-slate-100 mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">T O T A L</span>
                                            <span className={`text-xs font-black ${formData.paymentStatus ? 'text-emerald-500' : 'text-slate-400 italic'}`}>
                                                {formData.paymentStatus || "결제 대기"}
                                            </span>
                                        </div>
                                        <span className="text-5xl font-black text-indigo-600 tracking-tighter">
                                            {totalAmount.toLocaleString()}
                                            <span className="text-lg ml-1 font-black">원</span>
                                        </span>
                                    </div>
                                </div>

                                {formData.requestNote && (
                                    <div className="bg-slate-50/50 rounded-[2.5rem] p-8 mt-4 border border-slate-100 relative">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Request Note</label>
                                        <p className="text-lg font-bold text-slate-600 leading-relaxed italic break-keep">
                                            "{formData.requestNote}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="h-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1.5 opacity-30">
                                {[...Array(15)].map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

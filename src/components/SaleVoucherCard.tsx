"use client";

import { ShoppingCart, User, Calendar, Receipt, MapPin, Phone, MessageSquare, CreditCard, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { updateSaleStatus } from "@/app/sales/actions";
import type { OrderStatus } from "@prisma/client";

interface SaleVoucherCardProps {
    sale: any;
    onClick?: () => void;
}

const statusMap: Record<string, { label: string, color: string, bg: string }> = {
    STANDBY: { label: "접수대기", color: "text-slate-600", bg: "bg-slate-100" },
    ACCEPTED: { label: "주문접수", color: "text-blue-600", bg: "bg-blue-100" },
    PACKING: { label: "포장중", color: "text-amber-600", bg: "bg-amber-100" },
    DELIVERY_READY: { label: "전달대기", color: "text-purple-600", bg: "bg-purple-100" },
    COMPLETED: { label: "완료", color: "text-emerald-600", bg: "bg-emerald-100" },
    CANCELLED: { label: "취소", color: "text-rose-600", bg: "bg-rose-100" },
};

const statusOrder: OrderStatus[] = ["STANDBY", "ACCEPTED", "PACKING", "DELIVERY_READY", "COMPLETED", "CANCELLED"];

export default function SaleVoucherCard({ sale, onClick }: SaleVoucherCardProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const currentStatus = statusMap[sale.status] || statusMap.STANDBY;

    const handleStatusClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening detail modal

        const currentIndex = statusOrder.indexOf(sale.status as OrderStatus);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        const nextStatus = statusOrder[nextIndex];

        setIsUpdating(true);
        try {
            await updateSaleStatus(sale.id, nextStatus);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div
            onClick={onClick}
            className="group relative bg-white rounded-[2.5rem] border-4 border-white shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden flex flex-col font-mono"
        >
            {/* Indigo Header Strip */}
            <div className="h-3 bg-indigo-600 w-full shrink-0"></div>

            <div className="p-8 space-y-6 flex-1 flex flex-col pb-6">
                {/* Sale Header */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${sale.source === 'NAVER' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                            {sale.source}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300">#{sale.id.slice(-6).toUpperCase()}</span>
                    </div>

                    <button
                        onClick={handleStatusClick}
                        disabled={isUpdating}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 ${currentStatus.bg} ${currentStatus.color} ${isUpdating ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                    >
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <div className={`w-1.5 h-1.5 rounded-full bg-current opacity-60`} />}
                        {currentStatus.label}
                    </button>
                </div>

                <div className="text-center border-b-2 border-slate-100 pb-4">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-slate-900 line-clamp-1">{sale.customerName || "???"}</span>
                        <span className="text-sm font-black text-indigo-500 mt-1">{sale.customerPhone || "전화번호 없음"}</span>
                    </div>
                </div>

                {/* Date & Address */}
                <div className="space-y-2">
                    {sale.utilizationDate && (
                        <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{new Date(sale.utilizationDate).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    )}
                    <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 mt-1 shrink-0" />
                        <span className="text-sm font-black text-slate-800 leading-tight line-clamp-2">
                            {sale.address || "매장 수령 / 주소 미입력"}
                        </span>
                    </div>
                </div>

                {/* Items List - Compactized */}
                <div className="space-y-2 flex-1 pt-2">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Items List</div>
                    <div className="space-y-1.5">
                        {sale.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-700 truncate max-w-[150px]">
                                    {item.product ? item.product.name : (item.customName || "알 수 없는 상품")}
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-indigo-400">x{item.quantity}</span>
                                    <span className="font-black text-slate-900">{(item.price * item.quantity).toLocaleString()}원</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="pt-4 border-t-2 border-slate-50 space-y-1">
                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase">
                        <span>Extra & Discount</span>
                        <span>
                            {sale.deliveryFee > 0 && `+${sale.deliveryFee.toLocaleString()} `}
                            {sale.discountValue > 0 && `-${sale.discountValue.toLocaleString()}`}
                        </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Total Price</span>
                        <span className="text-3xl font-black text-indigo-600 tracking-tighter">
                            {sale.totalAmount.toLocaleString()}
                            <span className="text-sm ml-0.5">원</span>
                        </span>
                    </div>
                </div>

                {/* Memo / Request */}
                {sale.requestNote && (
                    <div className="bg-slate-50 rounded-2xl p-4 relative overflow-hidden shrink-0 mt-2">
                        <MessageSquare className="absolute -bottom-2 -right-2 w-10 h-10 text-slate-100 rotate-12" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Customer Note</span>
                        <p className="text-xs font-bold text-slate-600 line-clamp-2 relative z-10">{sale.requestNote}</p>
                    </div>
                )}
            </div>

            {/* View Detail Indicator */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-center items-center gap-2 group-hover:bg-indigo-600 transition-colors duration-300">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Voucher Detail</span>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-white transition-colors" />
            </div>
        </div>
    );
}

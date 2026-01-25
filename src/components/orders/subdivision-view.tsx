'use client';

import { useState, useEffect } from 'react';
import { Package, Clock, User, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateOrderStatus } from '@/actions/orders';
import { useRouter } from 'next/navigation';

interface KitchenItem {
    name: string;
    quantity: number;
    orderId: string;
    customerName: string;
    pickupTime: string | null;
    pickupType: string;
    status: string;
    workType: string;
}

interface GeneralSubdivisionViewProps {
    data: {
        subdivision: KitchenItem[];
        others: KitchenItem[];
    };
}

export function GeneralSubdivisionView({ data }: GeneralSubdivisionViewProps) {
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    const handleStatusUpdate = async (orderId: string, nextStatus: 'PREPARING' | 'READY_FOR_PICKUP' | 'READY_FOR_DELIVERY') => {
        const res = await updateOrderStatus(orderId, nextStatus as any);
        if (res.success) {
            router.refresh();
        }
    };

    const renderCard = (item: KitchenItem, index: number) => (
        <div key={`${item.orderId}-${index}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                        <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{item.customerName}</h4>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {item.pickupTime || '시간미정'} ({item.pickupType === 'DELIVERY' ? '배달' : '픽업'})
                        </div>
                    </div>
                </div>
                <div className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase",
                    item.status === 'CONFIRMED' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                )}>
                    {item.status === 'CONFIRMED' ? '접수됨' : '준비중'}
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">{item.name}</span>
                <span className="bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 px-3 py-1 rounded-full text-sm font-black">
                    {item.quantity}개
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {item.status === 'CONFIRMED' && (
                    <button
                        onClick={() => handleStatusUpdate(item.orderId, 'PREPARING')}
                        className="col-span-2 flex items-center justify-center gap-2 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                    >
                        <Package className="w-4 h-4" />
                        작업 시작
                    </button>
                )}
                {item.status === 'PREPARING' && (
                    <button
                        onClick={() => handleStatusUpdate(item.orderId, item.pickupType === 'DELIVERY' ? 'READY_FOR_DELIVERY' : 'READY_FOR_PICKUP')}
                        className="col-span-2 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        포장 완료
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">실시간 소분/포장 현황</h1>
                    <p className="text-slate-500 dark:text-slate-400">상품 소분 및 포장 업무를 위한 전용 페이지입니다.</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="text-lg font-mono font-bold text-slate-700 dark:text-slate-300">
                        {currentTime.toLocaleTimeString('ko-KR', { hour12: false })}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 소분 섹션 */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="bg-blue-100 p-2 rounded-xl">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">소분 대상</h2>
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                            {data.subdivision.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.subdivision.length > 0 ? (
                            data.subdivision.map((item, idx) => renderCard(item, idx))
                        ) : (
                            <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-slate-400 text-sm font-medium">현재 소분할 품목이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 기타/음료 섹션 */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="bg-slate-100 p-2 rounded-xl">
                            <ShoppingCart className="w-5 h-5 text-slate-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">기타 및 음료</h2>
                        <span className="bg-slate-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                            {data.others.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.others.length > 0 ? (
                            data.others.map((item, idx) => renderCard(item, idx))
                        ) : (
                            <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-slate-400 text-sm font-medium">기타 준비 품목이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

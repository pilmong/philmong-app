'use client';

import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    ShoppingBag,
    ChefHat,
    Package,
    TrendingUp,
    Clock,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Utensils
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getCombinedDashboardData } from '@/actions/dashboard';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function DashboardView() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 60000); // 1분마다 갱신
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const result = await getCombinedDashboardData();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
    );

    const StatCard = ({ title, value, icon: Icon, color, subValue, href }: any) => (
        <Link href={href || "#"}>
            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
                            {subValue && <p className="text-xs text-slate-400 mt-1 font-bold">{subValue}</p>}
                        </div>
                        <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", color)}>
                            <Icon className="w-6 h-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">통합 관리 대시보드</h1>
                    <p className="text-slate-500 dark:text-slate-400">필몽 시스템의 실시간 현황과 주요 지표를 한눈에 파악합니다.</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 shadow-sm font-bold text-slate-600">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="오늘의 일반 주문"
                    value={`${data.generalSummary.total}건`}
                    subValue={`대기 ${data.generalSummary.pending} / 조리 ${data.generalSummary.preparing}`}
                    icon={ShoppingBag}
                    color="bg-blue-100 text-blue-600"
                    href="/admin/orders"
                />
                <StatCard
                    title="오늘의 런치 규모"
                    value={`${data.lunchSummary.lunchbox + data.lunchSummary.salad}개`}
                    subValue={`${data.lunchSummary.clientCount}개 고객사 납품`}
                    icon={Utensils}
                    color="bg-orange-100 text-orange-600"
                    href="/admin/lunch/work"
                />
                <StatCard
                    title="조리/포장 대기"
                    value={`${data.kitchenLoad.cooking + data.kitchenLoad.subdivision}건`}
                    subValue={`조리 ${data.kitchenLoad.cooking} / 소분 ${data.kitchenLoad.subdivision}`}
                    icon={ChefHat}
                    color="bg-purple-100 text-purple-600"
                    href="/admin/orders/kitchen"
                />
                <StatCard
                    title="확정 매출 요약"
                    value={`₩${data.generalSummary.revenue.toLocaleString()}`}
                    subValue="완료된 일반 주문 기준"
                    icon={TrendingUp}
                    color="bg-emerald-100 text-emerald-600"
                    href="/admin/orders/stats"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 실시간 주방 현황 요약 */}
                <Card className="lg:col-span-2 border-none shadow-sm h-full">
                    <CardHeader className="border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-slate-400" />
                                <CardTitle className="text-lg font-bold">실시간 업무 상태</CardTitle>
                            </div>
                            <Link href="/admin/orders/kitchen" className="text-xs text-blue-600 font-bold hover:underline">상세보기</Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* 조리 파트 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-900 font-black">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                    조리 팀 (Cooking)
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center">
                                    <div className="text-4xl font-black text-orange-600 mb-1">{data.kitchenLoad.cooking}</div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Active Tasks</div>
                                </div>
                            </div>
                            {/* 소분/포장 파트 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-900 font-black">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    포장 팀 (Packing)
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center">
                                    <div className="text-4xl font-black text-emerald-600 mb-1">{data.kitchenLoad.subdivision}</div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pending Items</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 다가오는 일정 */}
                <Card className="border-none shadow-sm h-full overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            <CardTitle className="text-lg font-bold">주요 일정 (Upcoming)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {data.upcoming.length > 0 ? (
                                data.upcoming.map((order: any) => (
                                    <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
                                            <span className={cn(
                                                "text-[10px] px-2 py-0.5 rounded-full font-black",
                                                order.pickupType === 'DELIVERY' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {order.pickupType === 'DELIVERY' ? '배달' : '픽업'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 mb-2 font-medium">
                                            {format(new Date(order.pickupDate), 'HH:mm')} 예정
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {order.items.slice(0, 2).map((item: any, i: number) => (
                                                <span key={i} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                                                    {item.name} x{item.quantity}
                                                </span>
                                            ))}
                                            {order.items.length > 2 && <span className="text-[10px] text-slate-400 ml-1">외 {order.items.length - 2}건</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center text-slate-400 text-sm italic font-medium">
                                    현재 예정된 일정이 없습니다.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

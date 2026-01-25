'use client';

import { useState, useEffect } from 'react';
import { getLunchStats } from '@/actions/lunch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, Award, Calendar, PiggyBank, Receipt } from 'lucide-react';

export function LunchStatsView() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getLunchStats();
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-20">통계 데이터를 분석 중입니다...</div>;
    if (!stats) return <div className="text-center py-20">데이터가 없습니다.</div>;

    const { revenue, cost, profit, margin } = stats.total;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">비즈니스 인사이트 & 수익 분석</h1>
                    <p className="text-sm text-slate-500">최근 30일간의 데이터를 바탕으로 **매출, 원가, 순이익**을 정밀 분석합니다.</p>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-2 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-bold text-orange-900">평균 수익률: <span className="text-xl font-black text-orange-600">{margin}%</span></span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><TrendingUp size={64} /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-100">최근 30일 총 매출</CardDescription>
                        <CardTitle className="text-3xl font-black">₩{revenue.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-blue-200 flex items-center gap-1">
                            <Receipt size={12} /> 주문 {stats.dailyTrend.reduce((sum: number, d: any) => sum + d.lunchbox + d.salad, 0)}건 발생
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative border-l-4 border-orange-500">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><PiggyBank size={64} /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-400">최근 30일 예상 순이익</CardDescription>
                        <CardTitle className="text-3xl font-black text-orange-400">₩{profit.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-slate-500 flex items-center gap-1 font-bold">
                            <span className="text-orange-500">마진 {margin}%</span> 적용 (원가 ₩{cost.toLocaleString()})
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>총 도시락 판매</CardDescription>
                        <CardTitle className="text-2xl font-black">{stats.ratio[0].value.toLocaleString()}<span className="text-sm ml-1 font-normal">개</span></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between text-[10px] mb-1 font-bold">
                            <span className="text-slate-500">목표 달성률</span>
                            <span className="text-orange-600">75%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full" style={{ width: '75%' }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>총 샐러드 판매</CardDescription>
                        <CardTitle className="text-2xl font-black">{stats.ratio[1].value.toLocaleString()}<span className="text-sm ml-1 font-normal">개</span></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between text-[10px] mb-1 font-bold">
                            <span className="text-slate-500">목표 달성률</span>
                            <span className="text-emerald-600">25%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: '25%' }}></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Trend Chart */}
                <Card className="lg:col-span-4 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" /> 일별 매출 및 이익 추이
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-end gap-1 px-6 pb-10">
                        {stats.dailyTrend.map((d: any, i: number) => {
                            const maxVal = Math.max(...stats.dailyTrend.map((x: any) => x.revenue));
                            const revHeight = (d.revenue / maxVal) * 100;
                            const profHeight = (d.profit / maxVal) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                    <div className="w-full flex flex-col-reverse items-center h-full">
                                        <div
                                            className="w-full bg-blue-100 group-hover:bg-blue-300 transition-colors rounded-t-sm relative"
                                            style={{ height: `${Math.max(revHeight, 2)}%` }}
                                        >
                                            <div
                                                className="absolute bottom-0 left-0 w-full bg-orange-400 transition-colors"
                                                style={{ height: `${Math.max((profHeight / revHeight) * 100, 0)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 shadow-xl">
                                        <p className="font-bold">매출: ₩{d.revenue.toLocaleString()}</p>
                                        <p className="text-orange-400">이익: ₩{d.profit.toLocaleString()}</p>
                                    </div>
                                    <span className="text-[8px] text-slate-400 rotate-45 mt-1">{d.date}</span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Top Clients Ranking */}
                <Card className="lg:col-span-3 border-none shadow-sm bg-slate-50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-500" /> 우수 고객사 TOP 5
                        </CardTitle>
                        <CardDescription>매출 기여도 순위</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {stats.topClients.map((c: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-white transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                            i === 0 ? "bg-yellow-500 text-white" : "bg-slate-200 text-slate-500"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{c.name}</div>
                                            <div className="text-[10px] text-slate-500">최근 주문 기반</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-sm">₩{c.revenue.toLocaleString()}</div>
                                        <div className="text-[9px] text-blue-600 font-bold">VIP Grade</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>도시락 vs 샐러드 선호도</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-around py-6">
                        {stats.ratio.map((r: any, i: number) => (
                            <div key={i} className="flex flex-col items-center gap-3">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                                        <circle
                                            cx="64" cy="64" r="50" fill="transparent" stroke={r.color} strokeWidth="12"
                                            strokeDasharray={`${(r.value / (stats.ratio[0].value + stats.ratio[1].value)) * 314} 314`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black">{Math.round((r.value / (stats.ratio[0].value + stats.ratio[1].value)) * 100)}%</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">{r.name}</span>
                                    </div>
                                </div>
                                <div className="text-center text-sm font-bold">{r.value.toLocaleString()}건</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <CardHeader>
                        <CardTitle className="text-lg">수익성 운영 가이드</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 text-orange-400 font-black">!</div>
                            <div>
                                <h5 className="font-bold text-sm mb-1 text-orange-400">데이터 기반 의사결정</h5>
                                <p className="text-xs text-slate-400 leading-relaxed">현재 평균 마진율은 {margin}%입니다. 원재료비 상승 시 시스템 설정에서 원가를 업데이트하여 실시간 수익성을 관리하세요.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 font-black">?</div>
                            <div>
                                <h5 className="font-bold text-sm mb-1 text-blue-400">수익 극대화 팁</h5>
                                <p className="text-xs text-slate-400 leading-relaxed">샐러드 대비 도시락의 이익 기여도가 높습니다. 도시락 특화 고객사에 집중하거나 샐러드 단가 조정을 통해 수익 구조를 개선해 보세요.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

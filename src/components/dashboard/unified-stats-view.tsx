'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    TrendingUp, ShoppingBag, DollarSign, Award, Target,
    PieChart as PieChartIcon, ArrowRight, Utensils, Zap, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['#3b82f6', '#f97316', '#10b981', '#6366f1', '#f43f5e', '#a855f7'];

interface UnifiedStatsViewProps {
    data: any;
}

export function UnifiedStatsView({ data }: UnifiedStatsViewProps) {
    const { summary, dailyTrend, general, lunch } = data;

    return (
        <div className="space-y-8 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest mb-1">
                        <Zap className="w-3 h-3" /> Real-time Business Analytics
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">통합 비즈니스 리포트</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">최근 30일간의 일반 주문과 런치 서비스를 통합 분석한 데이터입니다.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Overall Margin</span>
                        <span className="text-xl font-black text-emerald-600">{summary.margin}%</span>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Period</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Last 30 Days</span>
                    </div>
                </div>
            </div>

            {/* Main Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign size={80} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">총 통합 매출액</CardDescription>
                        <CardTitle className="text-3xl font-black tracking-tighter italic">₩{summary.totalRevenue.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-[11px] text-slate-400 font-medium">일반 ₩{summary.generalRevenue.toLocaleString()} + 런치 ₩{summary.lunchRevenue.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-slate-800 border-b-4 border-b-blue-500">
                    <CardHeader className="pb-1">
                        <CardDescription className="font-bold text-[10px] uppercase text-blue-500">일반 주문 매출</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900 dark:text-white">₩{summary.generalRevenue.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-[11px] text-slate-500 font-bold tracking-tighter">총 {general.channels.reduce((sum: any, c: any) => sum + c.value, 0)}건의 일반 고객 주문</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-slate-800 border-b-4 border-b-orange-500">
                    <CardHeader className="pb-1">
                        <CardDescription className="font-bold text-[10px] uppercase text-orange-500">런치 서비스 매출</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900 dark:text-white">₩{summary.lunchRevenue.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-[11px] text-slate-500 font-bold tracking-tighter">도시락/샐러드 합계 {summary.totalOrders - general.channels.reduce((sum: any, c: any) => sum + c.value, 0)}개 납품</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-slate-800 border-b-4 border-b-emerald-500">
                    <CardHeader className="pb-1">
                        <CardDescription className="font-bold text-[10px] uppercase text-emerald-500">런치 순이익 (예상)</CardDescription>
                        <CardTitle className="text-3xl font-black text-emerald-600 tracking-tighter">₩{summary.profit.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-[11px] text-slate-500 font-bold tracking-tighter">매출 대비 예상 수익률 {summary.margin}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Integrated Trend Chart */}
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 px-10 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2 italic">
                                <TrendingUp className="w-6 h-6 text-blue-500" /> INTEGRATED REVENUE CYCLE
                            </CardTitle>
                            <CardDescription className="font-bold">일간 매출 변동 추이 (일반 주문 vs 런치 서비스)</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="h-[450px] px-6 pb-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyTrend}>
                            <defs>
                                <linearGradient id="colorGeneral" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorLunch" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" fontSize={11} stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ className: "font-bold" }} />
                            <YAxis fontSize={11} stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(v) => `₩${(v / 10000).toLocaleString()}만`} tick={{ className: "font-bold" }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '20px' }}
                                itemStyle={{ fontWeight: '900', fontSize: '12px' }}
                                labelStyle={{ fontWeight: '900', marginBottom: '10px' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Area type="monotone" name="일반 주문 (General)" dataKey="general" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorGeneral)" />
                            <Area type="monotone" name="런치 서비스 (Lunch)" dataKey="lunch" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorLunch)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Segment Analysis */}
                <Card className="border-none shadow-md overflow-hidden rounded-[2rem]">
                    <CardHeader className="bg-blue-600 text-white">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5" />
                            <CardTitle className="text-lg font-black italic">GENERAL SALES SEGMENT</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">인기 상품 Top 5</h4>
                            <div className="space-y-4">
                                {general.products.slice(0, 5).map((p: any, i: number) => (
                                    <div key={p.name} className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm font-bold mb-1">
                                                <span>{p.name}</span>
                                                <span className="text-blue-600 italic">₩{p.revenue.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-blue-500 h-full" style={{ width: `${(p.quantity / general.products[0].quantity) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">채널별 주문 비중</h4>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={general.channels}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {general.channels.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lunch Segment Analysis */}
                <Card className="border-none shadow-md overflow-hidden rounded-[2rem]">
                    <CardHeader className="bg-orange-600 text-white">
                        <div className="flex items-center gap-2">
                            <Utensils className="w-5 h-5" />
                            <CardTitle className="text-lg font-black italic">LUNCH SERVICE SEGMENT</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">우수 고객사 Ranking</h4>
                            <div className="space-y-4">
                                {lunch.topClients.map((c: any, i: number) => (
                                    <div key={c.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-orange-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-black text-xs", i === 0 ? "bg-orange-500 text-white" : "bg-white text-slate-400 shadow-sm")}>{i + 1}</div>
                                            <span className="font-bold text-sm tracking-tight">{c.name}</span>
                                        </div>
                                        <span className="font-black text-slate-900 dark:text-white">₩{c.revenue.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4">
                            {lunch.ratio.map((r: any) => (
                                <div key={r.name} className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 text-center group hover:border-orange-200 transition-all">
                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2 group-hover:text-orange-500 transition-colors">{r.name} 판매량</div>
                                    <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 tabular-nums italic">{r.value.toLocaleString()}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">items per month</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

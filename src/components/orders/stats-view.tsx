'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, ShoppingBag, DollarSign, Award, Target, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface GeneralStatsViewProps {
    data: {
        daily: any[];
        channels: any[];
        products: any[];
        summary: {
            totalRevenue: number;
            totalOrders: number;
            avgOrderValue: number;
        };
    };
}

export function GeneralStatsView({ data }: GeneralStatsViewProps) {
    const { daily, channels, products, summary } = data;

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">일반 상품 매출 분석</h1>
                <p className="text-slate-500 dark:text-slate-400">최근 30일간의 주문 데이터를 기반으로 한 비즈니스 분석 리포트입니다.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            <CardDescription className="text-blue-600 font-bold">총 매출액</CardDescription>
                        </div>
                        <CardTitle className="text-3xl font-black">{summary.totalRevenue.toLocaleString()}<span className="text-lg ml-1 font-normal">원</span></CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <ShoppingBag className="w-4 h-4 text-indigo-600" />
                            <CardDescription className="text-indigo-600 font-bold">총 주문 건수</CardDescription>
                        </div>
                        <CardTitle className="text-3xl font-black">{summary.totalOrders}<span className="text-lg ml-1 font-normal">건</span></CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-slate-100 dark:bg-slate-800 border-l-4 border-l-slate-400">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-slate-600" />
                            <CardDescription className="text-slate-600 font-bold">평균 객단가</CardDescription>
                        </div>
                        <CardTitle className="text-3xl font-black">{summary.avgOrderValue.toLocaleString()}<span className="text-lg ml-1 font-normal">원</span></CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Revenue Chart */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            최근 매출 추이
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={daily}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" fontSize={12} stroke="#94a3b8" axisLine={false} tickLine={false} />
                                <YAxis fontSize={12} stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 10000}만`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${value.toLocaleString()}원`, '매출']}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Channel Ratio Chart */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-emerald-500" />
                            판매 채널 비중
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={channels}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {channels.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 dark:fill-white font-bold text-xl">
                                    {summary.totalOrders}건
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-32 space-y-2">
                            {channels.map((c, i) => (
                                <div key={c.name} className="flex items-center gap-2 text-xs">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">{c.name}</span>
                                    <span className="ml-auto font-bold">{c.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products Table */}
                <Card className="border-none shadow-sm lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" />
                            인기 상품 Top 10 (판매량 기준)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {products.map((product, idx) => (
                                <div key={product.name} className="flex items-center gap-4">
                                    <span className="w-6 font-mono text-slate-300 font-bold">{idx + 1}</span>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{product.name}</span>
                                            <span className="font-mono">{product.quantity}개 / {product.revenue.toLocaleString()}원</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-slate-900 dark:bg-slate-50 rounded-full transition-all duration-1000"
                                                style={{ width: `${(product.quantity / products[0].quantity) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

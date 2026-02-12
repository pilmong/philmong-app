"use client"

import React, { useState, useEffect } from "react"
import { PieChart, TrendingUp, Trophy, ShoppingBag, Building2, Loader2 } from 'lucide-react'
import { getPurchaseStatistics, getMonthlyTrend } from "@/lib/purchase/actions"
import { StatsPeriod } from "@/lib/purchase/types"

export default function PurchaseStats() {
    const [period, setPeriod] = useState<StatsPeriod>("THIS_MONTH")
    const [stats, setStats] = useState<any>(null)
    const [trend, setTrend] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [period])

    const loadData = async () => {
        setLoading(true)
        const [statsRes, trendRes] = await Promise.all([
            getPurchaseStatistics(period),
            getMonthlyTrend()
        ])
        if (statsRes.success && statsRes.data) setStats(statsRes.data)
        if (trendRes.success && trendRes.data) setTrend(trendRes.data)
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="flex justify-center p-24">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Period Selector */}
            <div className="flex justify-end">
                <div className="bg-white p-1 rounded-lg border border-slate-200 inline-flex shadow-sm">
                    {[
                        { label: "이번 달", value: "THIS_MONTH" },
                        { label: "지난 달", value: "LAST_MONTH" },
                        { label: "이번 분기", value: "THIS_QUARTER" },
                        { label: "올해", value: "THIS_YEAR" },
                        { label: "전체", value: "ALL" },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setPeriod(opt.value as StatsPeriod)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === opt.value
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <span className="text-slate-500 font-medium text-sm">총 지출액</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {stats?.totalAmount.toLocaleString()}원
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <span className="text-slate-500 font-medium text-sm">업무용 매입</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {stats?.byUsage.find((s: any) => s.usage === "BUSINESS")?.amount.toLocaleString() || 0}원
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-blue-500" style={{ width: `${(stats?.byUsage?.find((s: any) => s.usage === "BUSINESS")?.amount || 0) / (stats?.totalAmount || 1) * 100}%` }}></div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <span className="text-slate-500 font-medium text-sm">개인용 매입</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {stats?.byUsage.find((s: any) => s.usage === "PERSONAL")?.amount.toLocaleString() || 0}원
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-green-500" style={{ width: `${(stats?.byUsage?.find((s: any) => s.usage === "PERSONAL")?.amount || 0) / (stats?.totalAmount || 1) * 100}%` }}></div>
                </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    최근 6개월 지출 추이
                </h3>
                <div className="h-48 flex items-end gap-2 sm:gap-4 justify-between">
                    {trend.map((d, idx) => {
                        const maxAmount = Math.max(...trend.map(t => t.amount), 1)
                        const heightPercent = Math.max((d.amount / maxAmount) * 100, 5)
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden transition-all group-hover:bg-slate-200" style={{ height: `${heightPercent}%` }}>
                                    <div className="absolute bottom-0 left-0 w-full bg-indigo-500/80 transition-all hover:bg-indigo-600" style={{ height: '100%' }}></div>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        {d.amount.toLocaleString()}원
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">{d.month.split('-')[1]}월</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Top Vendors */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        거래처별 매입 TOP 10
                    </h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {stats?.byVendor.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">데이터가 없습니다.</div>
                    ) : (
                        stats?.byVendor.map((v: any, idx: number) => (
                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx < 3 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                                        {idx + 1}
                                    </span>
                                    <span className="font-medium text-slate-700 text-sm">{v.vendorName}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-800">{v.amount.toLocaleString()}원</span>
                                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                        <div className="h-full bg-indigo-500" style={{ width: `${(v.amount / stats.byVendor[0].amount) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

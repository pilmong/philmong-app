'use client';

import { useState, useEffect } from 'react';
import { getLunchSettlement, getClientSettlement, bulkUpdateLunchOrderStatusByPeriod } from '@/actions/lunch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { FileText, ArrowLeft, CheckCircle2, Loader2, Calendar, Zap, History, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SettlementRow {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    totalLunchbox: number;
    totalSalad: number;
    totalPrice: number;
    orderCount: number;
    unpaidCount: number;
    isLoading: boolean;
}

export function SettlementView() {
    const [settlements, setSettlements] = useState<SettlementRow[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const today = new Date();
    const thisMonthStart = startOfMonth(today);
    const thisMonthEnd = endOfMonth(today);

    useEffect(() => {
        loadInitialList();
    }, []);

    const loadInitialList = async () => {
        setInitialLoading(true);
        try {
            // 이번 달을 기본값으로 하여 목록을 가져옵니다.
            const data = await getLunchSettlement(thisMonthStart, thisMonthEnd);
            setSettlements(data.map(item => ({
                ...item,
                startDate: thisMonthStart,
                endDate: thisMonthEnd,
                isLoading: false
            })));
        } catch (error) {
            console.error(error);
        } finally {
            setInitialLoading(initialLoading => false);
        }
    };

    const fetchRowData = async (id: string, start: Date, end: Date) => {
        setSettlements(prev => prev.map(s => s.id === id ? { ...s, isLoading: true } : s));
        try {
            const result = await getClientSettlement(id, start, end);
            if (result) {
                setSettlements(prev => prev.map(s =>
                    s.id === id ? {
                        ...s,
                        ...result,
                        startDate: start,
                        endDate: end,
                        isLoading: false
                    } : s
                ));
            }
        } catch (error) {
            console.error(error);
            setSettlements(prev => prev.map(s => s.id === id ? { ...s, isLoading: false } : s));
        }
    };

    const handleQuickRange = (id: string, type: 'HALF' | 'THIS_MONTH' | 'LAST_MONTH') => {
        let start = new Date();
        let end = new Date();

        if (type === 'HALF') {
            const day = today.getDate();
            if (day <= 15) {
                start = startOfMonth(today);
                end = new Date(today.getFullYear(), today.getMonth(), 15);
            } else {
                start = new Date(today.getFullYear(), today.getMonth(), 16);
                end = endOfMonth(today);
            }
        } else if (type === 'THIS_MONTH') {
            start = startOfMonth(today);
            end = endOfMonth(today);
        } else if (type === 'LAST_MONTH') {
            const lastMonth = subMonths(today, 1);
            start = startOfMonth(lastMonth);
            end = endOfMonth(lastMonth);
        }

        fetchRowData(id, start, end);
    };

    const updateDate = (id: string, field: 'startDate' | 'endDate', value: string) => {
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        const row = settlements.find(s => s.id === id);
        if (!row) return;

        const start = field === 'startDate' ? newDate : row.startDate;
        const end = field === 'endDate' ? newDate : row.endDate;

        fetchRowData(id, start, end);
    };

    const handleSettleAll = async (id: string) => {
        const row = settlements.find(s => s.id === id);
        if (!row) return;

        if (!confirm(`[${row.name}] 고객사의 선택된 기간(${format(row.startDate, 'MM/dd')}~${format(row.endDate, 'MM/dd')}) 내 배달 완료된 주문을 결제 완료 처리하시겠습니까?`)) return;

        setProcessingId(id);
        try {
            const result = await bulkUpdateLunchOrderStatusByPeriod(id, row.startDate, row.endDate, 'PAID');
            if (result.success) {
                await fetchRowData(id, row.startDate, row.endDate);
            }
        } catch (error) {
            console.error(error);
            alert('결제 처리 중 오류가 발생했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Minimal Header */}
            <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                    <History className="h-4 w-4" /> Settlement Workflow
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">정산 및 명세서 발행</h1>
                <p className="text-slate-500 font-medium text-lg">각 고객사의 결제 주기에 맞춰 기간을 설정하고 명세서를 발급합니다.</p>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <FileText className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">발행 대상 고객사 목록</h2>
                    </div>
                    <Badge variant="outline" className="rounded-full px-4 py-1.5 border-slate-200 font-bold text-slate-500 bg-white">
                        {settlements.length} PERIODIC CLIENTS
                    </Badge>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50 border-none hover:bg-transparent">
                                <TableHead className="px-10 h-16 font-black text-[11px] text-slate-400 uppercase tracking-widest">Client Name</TableHead>
                                <TableHead className="h-16 font-black text-[11px] text-slate-400 uppercase tracking-widest">Settlement Period</TableHead>
                                <TableHead className="text-right h-16 font-black text-[11px] text-slate-400 uppercase tracking-widest">Aggregated Status</TableHead>
                                <TableHead className="text-right h-16 font-black text-[11px] text-slate-400 uppercase tracking-widest">Grand Total</TableHead>
                                <TableHead className="px-10 text-center h-16 font-black text-[11px] text-slate-400 uppercase tracking-widest">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-40 text-slate-300 font-black text-2xl animate-pulse">LOADING WORKFLOW...</TableCell></TableRow>
                            ) : settlements.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-40 text-slate-400 font-bold italic text-lg">명세서 발행 대상 고객사가 없습니다.</TableCell></TableRow>
                            ) : (
                                settlements.map((s) => (
                                    <TableRow key={s.id} className="group hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all border-b border-slate-50 dark:border-slate-800/10">
                                        <TableCell className="px-10 py-10">
                                            <div className="font-black text-slate-900 dark:text-white text-xl tracking-tighter group-hover:text-blue-600 transition-colors">{s.name}</div>
                                            <div className="flex items-center gap-1.5 mt-2">
                                                <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-none text-[9px] font-black px-2 h-5 rounded-md">PERIODIC</Badge>
                                                {s.isLoading && (
                                                    <div className="flex items-center gap-1.5 text-blue-500 animate-pulse">
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        <span className="text-[9px] font-black uppercase">Syncing...</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-700 w-fit group-hover:border-blue-200 transition-colors">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase ml-0.5">Start</span>
                                                        <input
                                                            type="date"
                                                            value={format(s.startDate, 'yyyy-MM-dd')}
                                                            onChange={(e) => updateDate(s.id, 'startDate', e.target.value)}
                                                            className="bg-transparent border-none text-xs font-black text-slate-800 dark:text-slate-200 focus:ring-0 p-0 w-[110px]"
                                                        />
                                                    </div>
                                                    <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase ml-0.5">End</span>
                                                        <input
                                                            type="date"
                                                            value={format(s.endDate, 'yyyy-MM-dd')}
                                                            onChange={(e) => updateDate(s.id, 'endDate', e.target.value)}
                                                            className="bg-transparent border-none text-xs font-black text-slate-800 dark:text-slate-200 focus:ring-0 p-0 w-[110px]"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-[10px] font-black rounded-lg hover:bg-white hover:text-blue-600 hover:shadow-sm"
                                                        onClick={() => handleQuickRange(s.id, 'HALF')}
                                                    >
                                                        1-15일
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-[10px] font-black rounded-lg hover:bg-white hover:text-blue-600 hover:shadow-sm"
                                                        onClick={() => handleQuickRange(s.id, 'THIS_MONTH')}
                                                    >
                                                        이번달
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-[10px] font-black rounded-lg hover:bg-white hover:text-blue-600 hover:shadow-sm"
                                                        onClick={() => handleQuickRange(s.id, 'LAST_MONTH')}
                                                    >
                                                        지난달
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end gap-1.5">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Lunchbox</span>
                                                        <span className="text-lg font-black text-blue-600 tabular-nums">{s.totalLunchbox}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Salad</span>
                                                        <span className="text-lg font-black text-emerald-600 tabular-nums">{s.totalSalad}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold h-5 border-none">
                                                    총 {s.orderCount}회 납품
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Billable</span>
                                                <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter group-hover:scale-110 transition-transform origin-right">
                                                    ₩{s.totalPrice.toLocaleString()}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-10 text-center">
                                            <div className="flex flex-col gap-2.5 items-center">
                                                <Link href={`/admin/lunch/settlement/invoice/${s.id}?start=${s.startDate.toISOString()}&end=${s.endDate.toISOString()}`} className="w-full">
                                                    <Button
                                                        className="w-full bg-slate-900 hover:bg-blue-600 text-white rounded-[1.2rem] h-12 font-black shadow-xl hover:shadow-blue-500/40 transition-all flex gap-2 border-none"
                                                        disabled={s.isLoading}
                                                    >
                                                        <FileText className="h-5 w-5" /> 명세 인쇄하기
                                                    </Button>
                                                </Link>
                                                {s.unpaidCount > 0 ? (
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-[1.2rem] h-10 font-black text-xs gap-2"
                                                        onClick={() => handleSettleAll(s.id)}
                                                        disabled={processingId === s.id || s.isLoading}
                                                    >
                                                        {processingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                        결제 처리 ({s.unpaidCount}건)
                                                    </Button>
                                                ) : (
                                                    <div className="text-slate-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 h-10">
                                                        <CheckCircle2 className="h-3 w-3" /> All Status Paid
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-center">
                <Link href="/admin/lunch">
                    <Button variant="outline" className="rounded-full px-8 py-6 h-auto font-black text-slate-400 hover:text-slate-900 hover:bg-white hover:border-slate-300 transition-all flex gap-3 border-slate-200">
                        <ArrowLeft className="h-5 w-5" /> 런치 관리 메인으로 돌아가기
                    </Button>
                </Link>
            </div>
        </div>
    );
}

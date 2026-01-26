'use client';

import { useState, useEffect } from 'react';
import { getLunchSettlement, getClientSettlement, bulkUpdateLunchOrderStatusByPeriod } from '@/actions/lunch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { FileText, ArrowLeft, CheckCircle2, Loader2, Wallet } from 'lucide-react';
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
    const [statsLoading, setStatsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const initialStart = startOfMonth(new Date());
    const initialEnd = endOfMonth(new Date());

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setStatsLoading(true);
        try {
            // 초기 리스트는 이번 달 기준으로 로드
            const data = await getLunchSettlement(initialStart, initialEnd);
            setSettlements(data.map(item => ({
                ...item,
                startDate: initialStart,
                endDate: initialEnd,
                isLoading: false
            })));
        } catch (error) {
            console.error(error);
        } finally {
            setStatsLoading(false);
        }
    };

    const updateRowDate = async (id: string, field: 'startDate' | 'endDate', value: string) => {
        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        setSettlements(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: newDate, isLoading: true } : s
        ));

        // 해당 행의 최신 날짜 상태 가져오기
        setSettlements(prev => {
            const currentRow = prev.find(s => s.id === id);
            if (!currentRow) return prev;

            const start = field === 'startDate' ? newDate : currentRow.startDate;
            const end = field === 'endDate' ? newDate : currentRow.endDate;

            // 비동기로 데이터 계산 요청
            getClientSettlement(id, start, end).then(result => {
                if (result) {
                    setSettlements(latest => latest.map(s =>
                        s.id === id ? {
                            ...s,
                            ...result,
                            startDate: start,
                            endDate: end,
                            isLoading: false
                        } : s
                    ));
                }
            }).catch(err => {
                console.error(err);
                setSettlements(latest => latest.map(s => s.id === id ? { ...s, isLoading: false } : s));
            });

            return prev;
        });
    };

    const handleSettleAll = async (id: string) => {
        const row = settlements.find(s => s.id === id);
        if (!row) return;

        if (!confirm(`[${row.name}] 고객사의 선택된 기간(${format(row.startDate, 'MM/dd')}~${format(row.endDate, 'MM/dd')}) 내 모든 배달 완료 주문을 결제 완료로 처리하시겠습니까?`)) return;

        setProcessingId(id);
        try {
            const result = await bulkUpdateLunchOrderStatusByPeriod(id, row.startDate, row.endDate, 'PAID');
            if (result.success) {
                // 성공 후 해당 행만 다시 로드
                const updated = await getClientSettlement(id, row.startDate, row.endDate);
                if (updated) {
                    setSettlements(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
                }
            }
        } catch (error) {
            console.error(error);
            alert('일괄 처리 중 오류가 발생했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    const totalRevenue = settlements.reduce((sum, s) => sum + s.totalPrice, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">정산 및 명세서 관리</h1>
                    <p className="text-muted-foreground mt-1 text-sm">기간별 정산 고객사의 명세서를 발행하고 결제를 관리합니다. (일일 결제 고객사 제외)</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <CardHeader className="pb-1">
                        <CardDescription className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">표시된 항목 예상 합계</CardDescription>
                        <CardTitle className="text-3xl font-black italic">₩{totalRevenue.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-[10px] text-slate-500 font-medium">각 고객사별 지정된 기간 기준 총액</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white dark:bg-slate-800">
                    <CardHeader className="pb-1">
                        <CardDescription className="font-bold text-[10px] uppercase text-slate-400">총 도시락 합계</CardDescription>
                        <CardTitle className="text-3xl font-black text-blue-600">
                            {settlements.reduce((sum, s) => sum + s.totalLunchbox, 0).toLocaleString()} <span className="text-sm text-slate-400 font-medium italic">개</span>
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white dark:bg-slate-800">
                    <CardHeader className="pb-1">
                        <CardDescription className="font-bold text-[10px] uppercase text-slate-400">총 샐러드 합계</CardDescription>
                        <CardTitle className="text-3xl font-black text-emerald-600">
                            {settlements.reduce((sum, s) => sum + s.totalSalad, 0).toLocaleString()} <span className="text-sm text-slate-400 font-medium italic">개</span>
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-2xl overflow-hidden lg:rounded-[2.5rem]">
                <CardHeader className="px-8 pt-8 pb-4 bg-white dark:bg-slate-900">
                    <CardTitle className="text-xl font-black flex items-center gap-2">
                        <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                        고객사별 정산 대상 리스트
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-0 bg-white dark:bg-slate-900">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="px-8 h-14 font-black text-slate-400 text-[11px] uppercase tracking-widest">고객사 정보</TableHead>
                                <TableHead className="h-14 font-black text-slate-400 text-[11px] uppercase tracking-widest">정산 기간 (개별 설정)</TableHead>
                                <TableHead className="text-right h-14 font-black text-slate-400 text-[11px] uppercase tracking-widest">납품 수량</TableHead>
                                <TableHead className="text-right h-14 font-black text-slate-400 text-[11px] uppercase tracking-widest">금액 요약</TableHead>
                                <TableHead className="px-8 text-center h-14 font-black text-slate-400 text-[11px] uppercase tracking-widest">정산 및 명세서</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {statsLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-24 text-slate-300 font-black text-xl animate-pulse">PREPARING CLIENT DATA...</TableCell></TableRow>
                            ) : settlements.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-32 text-slate-400 font-bold italic text-lg opacity-50">정산 대상 고객사가 없습니다.</TableCell></TableRow>
                            ) : (
                                settlements.map((s) => (
                                    <TableRow key={s.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all border-b border-slate-50 dark:border-slate-800/50">
                                        <TableCell className="px-8 py-8">
                                            <div className="font-black text-slate-900 dark:text-white text-lg tracking-tight group-hover:text-blue-600 transition-colors">{s.name}</div>
                                            {s.isLoading ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                                                    <span className="text-[10px] text-blue-500 font-black tracking-tighter">CALCULATING...</span>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Periodic Billing</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase ml-0.5">Start</span>
                                                    <input
                                                        type="date"
                                                        value={format(s.startDate, 'yyyy-MM-dd')}
                                                        onChange={(e) => updateRowDate(s.id, 'startDate', e.target.value)}
                                                        className="bg-transparent border-none text-[11px] font-black text-slate-800 dark:text-slate-200 focus:ring-0 cursor-pointer p-0 w-[100px]"
                                                    />
                                                </div>
                                                <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase ml-0.5">End</span>
                                                    <input
                                                        type="date"
                                                        value={format(s.endDate, 'yyyy-MM-dd')}
                                                        onChange={(e) => updateRowDate(s.id, 'endDate', e.target.value)}
                                                        className="bg-transparent border-none text-[11px] font-black text-slate-800 dark:text-slate-200 focus:ring-0 cursor-pointer p-0 w-[100px]"
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase">Lunch</span>
                                                        <span className="text-sm font-black text-blue-600">{s.totalLunchbox} <span className="text-[10px] text-slate-400">개</span></span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase">Salad</span>
                                                        <span className="text-sm font-black text-emerald-600">{s.totalSalad} <span className="text-[10px] text-slate-400">개</span></span>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[9px] h-4 rounded-md border-slate-100 dark:border-slate-800 text-slate-500 font-bold bg-white/50">
                                                    총 {s.orderCount}일 납품
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Grand Total</span>
                                                <div className="text-xl font-black text-slate-950 dark:text-white tracking-tighter tabular-nums group-hover:scale-105 transition-transform origin-right">
                                                    ₩{s.totalPrice.toLocaleString()}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {s.unpaidCount > 0 ? (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black gap-2 h-10 px-5 shadow-xl shadow-emerald-500/30 border-none group-hover:scale-105 transition-all"
                                                        onClick={() => handleSettleAll(s.id)}
                                                        disabled={processingId === s.id || s.isLoading}
                                                    >
                                                        {processingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                        결제 완료 ({s.unpaidCount}건)
                                                    </Button>
                                                ) : (
                                                    <div className="h-10 px-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-300 flex items-center gap-2 font-black text-[11px] uppercase">
                                                        <CheckCircle2 className="h-4 w-4 text-slate-200" /> All Paid
                                                    </div>
                                                )}
                                                <Link href={`/admin/lunch/settlement/invoice/${s.id}?start=${s.startDate.toISOString()}&end=${s.endDate.toISOString()}`}>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-2xl font-black gap-2 border-slate-200 h-10 px-5 hover:bg-white hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                                                        disabled={s.isLoading}
                                                    >
                                                        <FileText className="h-4 w-4 opacity-50" /> 명세 인쇄
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex justify-start pt-8 pb-12">
                <Link href="/admin/lunch">
                    <Button variant="ghost" className="rounded-2xl gap-2 text-slate-400 font-black text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group/btn">
                        <ArrowLeft className="h-4 w-4 group-hover/btn:-translate-x-1 transition-transform" />
                        BACK TO LUNCH MANAGEMENT
                    </Button>
                </Link>
            </div>
        </div>
    );
}

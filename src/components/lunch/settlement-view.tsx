'use client';

import { useState, useEffect } from 'react';
import { getLunchSettlement, bulkUpdateLunchOrderStatusByPeriod } from '@/actions/lunch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, FileText, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function SettlementView() {
    const [dateRange, setDateRange] = useState({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 })
    });
    const [settlements, setSettlements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadSettlements();
    }, [dateRange]);

    const loadSettlements = async () => {
        setLoading(true);
        try {
            const data = await getLunchSettlement(dateRange.start, dateRange.end);
            setSettlements(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSettleAll = async (clientId: string) => {
        if (!confirm('해당 기간의 모든 배달 완료 주문을 결제 완료로 처리하시겠습니까?')) return;

        setProcessingId(clientId);
        try {
            const result = await bulkUpdateLunchOrderStatusByPeriod(clientId, dateRange.start, dateRange.end, 'PAID');
            if (result.success) {
                await loadSettlements();
            }
        } catch (error) {
            console.error(error);
            alert('일괄 처리 중 오류가 발생했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    const handlePrevWeek = () => {
        setDateRange(prev => ({
            start: subDays(prev.start, 7),
            end: subDays(prev.end, 7)
        }));
    };

    const handleNextWeek = () => {
        setDateRange(prev => ({
            start: addDays(prev.start, 7),
            end: addDays(prev.end, 7)
        }));
    };

    const totalRevenue = settlements.reduce((sum, s) => sum + s.totalPrice, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">정산 및 명세서 관리</h1>
                    <p className="text-muted-foreground mt-1">고객사별 납품 수량을 집계하고 일괄 결제 및 명세서를 발행합니다.</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="px-4 font-black text-sm text-slate-700 dark:text-slate-300">
                        {format(dateRange.start, 'yyyy.MM.dd')} ~ {format(dateRange.end, 'yyyy.MM.dd')}
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleNextWeek} className="rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">총 매출 예상 합계</CardDescription>
                        <CardTitle className="text-3xl font-black">₩{totalRevenue.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-slate-500 font-medium">선택된 기간 내 모든 활성 고객사 기준</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white dark:bg-slate-800">
                    <CardHeader className="pb-2">
                        <CardDescription className="font-bold text-[10px] uppercase">총 도시락 공급</CardDescription>
                        <CardTitle className="text-3xl font-black text-blue-600">
                            {settlements.reduce((sum, s) => sum + s.totalLunchbox, 0).toLocaleString()} <span className="text-sm text-slate-400">개</span>
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white dark:bg-slate-800">
                    <CardHeader className="pb-2">
                        <CardDescription className="font-bold text-[10px] uppercase">총 샐러드 공급</CardDescription>
                        <CardTitle className="text-3xl font-black text-emerald-600">
                            {settlements.reduce((sum, s) => sum + s.totalSalad, 0).toLocaleString()} <span className="text-sm text-slate-400">개</span>
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-lg overflow-hidden lg:rounded-[2rem]">
                <CardHeader className="px-8 pt-8 pb-4">
                    <CardTitle className="text-xl font-black">고객사별 정산 리스트</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-y border-slate-100 dark:border-slate-800">
                                <TableHead className="px-8 h-12 font-bold text-slate-500">고객사명</TableHead>
                                <TableHead className="text-right font-bold text-slate-500">주문일수</TableHead>
                                <TableHead className="text-right font-bold text-slate-500">도시락/샐러드</TableHead>
                                <TableHead className="text-right font-bold text-slate-500">합계 금액</TableHead>
                                <TableHead className="px-8 text-center font-bold text-slate-500">결제 및 명세서</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 font-bold">데이터를 불러오는 중입니다...</TableCell></TableRow>
                            ) : settlements.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 font-bold italic text-lg">해당 기간의 납품 내역이 없습니다.</TableCell></TableRow>
                            ) : (
                                settlements.map((s) => (
                                    <TableRow key={s.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                                        <TableCell className="px-8 py-6">
                                            <div className="font-black text-slate-900 dark:text-white text-base">{s.name}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-600 dark:text-slate-400">{s.orderCount}일</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black text-blue-600">{s.totalLunchbox.toLocaleString()}개</span>
                                                <span className="text-[10px] font-bold text-emerald-600">{s.totalSalad.toLocaleString()}개</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="text-lg font-black text-slate-900 dark:text-white">₩{s.totalPrice.toLocaleString()}</div>
                                        </TableCell>
                                        <TableCell className="px-8 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {s.unpaidCount > 0 ? (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black gap-2 h-9 px-4 shadow-lg shadow-emerald-500/20"
                                                        onClick={() => handleSettleAll(s.id)}
                                                        disabled={processingId === s.id}
                                                    >
                                                        {processingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                        일괄 결제 완료 ({s.unpaidCount}건)
                                                    </Button>
                                                ) : (
                                                    <Badge variant="outline" className="bg-slate-100 text-slate-400 border-none px-3 py-1 font-bold h-9">
                                                        <CheckCircle2 className="h-3 w-3 mr-1 text-slate-300" /> 결제 완료
                                                    </Badge>
                                                )}
                                                <Link href={`/admin/lunch/settlement/invoice/${s.id}?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`}>
                                                    <Button size="sm" variant="outline" className="rounded-xl font-bold gap-2 border-slate-200 h-9 px-4">
                                                        <FileText className="h-4 w-4 text-slate-400" /> 명세서
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

            <div className="flex justify-start pt-4">
                <Link href="/admin/lunch">
                    <Button variant="ghost" className="rounded-xl gap-2 text-slate-500 font-bold hover:bg-slate-100">
                        <ArrowLeft className="h-4 w-4" /> 런치 관리 메인으로
                    </Button>
                </Link>
            </div>
        </div>
    );
}

function Wallet(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
    )
}

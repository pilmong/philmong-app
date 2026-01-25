'use client';

import { useState, useEffect } from 'react';
import { getKitchenWorkload } from '@/actions/lunch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Printer, ChevronLeft, ChevronRight, Utensils, ClipboardList, Info, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function KitchenSheetView({ date }: { date: Date }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [date]);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await getKitchenWorkload(date);
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="text-center py-20">작업 데이터를 불러오는 중...</div>;
    if (!data) return <div className="text-center py-20">데이터가 없습니다.</div>;

    const { total, orders, menu } = data;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Controls */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Utensils className="h-6 w-6 text-orange-500" />
                        조리실 작업지시서
                    </h1>
                    <Badge variant="outline" className="text-lg px-3 py-1 bg-white">
                        {format(date, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                    </Badge>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handlePrint}>
                        <Printer className="h-4 w-4" /> 지시서 인쇄
                    </Button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-orange-50 border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-orange-600 font-bold">총 조리 도시락</CardDescription>
                        <CardTitle className="text-4xl font-black">{total.lunchbox}<span className="text-xl ml-1 font-normal">개</span></CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-green-50 border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-green-600 font-bold">총 조리 샐러드</CardDescription>
                        <CardTitle className="text-4xl font-black">{total.salad}<span className="text-xl ml-1 font-normal">개</span></CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-600 font-bold">납품 고객사 수</CardDescription>
                        <CardTitle className="text-4xl font-black">{total.clientCount}<span className="text-xl ml-1 font-normal">곳</span></CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Today's Menu Card */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-900 text-white">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" /> 오늘의 메뉴 구성
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <h4 className="font-bold text-orange-500 border-b pb-2">도시락 (Lunchbox)</h4>
                        {menu?.lunchbox ? (
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <span className="text-slate-500">메인</span><span className="font-bold">{menu.lunchbox.main}</span>
                                <span className="text-slate-500">국/스프</span><span className="font-bold">{menu.lunchbox.soup}</span>
                                <span className="text-slate-500">밥</span><span className="font-bold">{menu.lunchbox.rice}</span>
                                <span className="text-slate-500">반찬1</span><span className="font-bold">{menu.lunchbox.banchan1}</span>
                                <span className="text-slate-500">반찬2</span><span className="font-bold">{menu.lunchbox.banchan2}</span>
                                <span className="text-slate-500">반찬3</span><span className="font-bold">{menu.lunchbox.banchan3}</span>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">등록된 메뉴 정보가 없습니다.</p>
                        )}
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold text-green-600 border-b pb-2">샐러드 (Salad)</h4>
                        {menu?.salad ? (
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <span className="text-slate-500">베이스</span><span className="font-bold">{menu.salad.layers?.base?.join(', ') || '-'}</span>
                                <span className="text-slate-500">토핑</span><span className="font-bold">{menu.salad.layers?.middle?.join(', ') || '-'}</span>
                                <span className="text-slate-500">드레싱/피니쉬</span><span className="font-bold">{menu.salad.layers?.top?.join(', ') || '-'}</span>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">등록된 메뉴 정보가 없습니다.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Client Breakdown Table */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">고객사별 배분표</CardTitle>
                    <CardDescription>각 고객사별 포장 수량 및 특이사항 확인</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 uppercase text-[10px] font-bold tracking-wider">
                                <TableHead className="w-[200px]">고객사명</TableHead>
                                <TableHead className="text-center bg-orange-50">도시락</TableHead>
                                <TableHead className="text-center bg-green-50">샐러드</TableHead>
                                <TableHead>조리/배송 요청사항</TableHead>
                                <TableHead className="w-[100px] text-center">체크</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((o: any) => (
                                <TableRow key={o.id} className="h-16">
                                    <TableCell className="font-bold">
                                        <div className="text-base">{o.clientName}</div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <MapPin className="h-2.5 w-2.5" /> {o.address}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center text-xl font-black text-orange-600 bg-orange-50/30">{o.lunchboxCount}</TableCell>
                                    <TableCell className="text-center text-xl font-black text-green-700 bg-green-50/30">{o.saladCount}</TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            {o.clientMemo && (
                                                <div className="text-xs flex items-start gap-1 text-blue-600 font-medium">
                                                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                                                    <span>[기본] {o.clientMemo}</span>
                                                </div>
                                            )}
                                            {o.memo && (
                                                <div className="text-xs flex items-start gap-1 text-red-600 font-bold italic">
                                                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                                                    <span>[당일] {o.memo}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-8 h-8 mx-auto border-2 border-slate-200 rounded-md"></div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1cm;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                    }
                    .pb-20 {
                        padding-bottom: 0 !important;
                    }
                    header, footer, nav, .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

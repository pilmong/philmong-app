'use client';

import { useState, useEffect } from 'react';
import { getKitchenWorkload } from '@/actions/lunch';
import { getSystemSettings } from '@/actions/settings';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Printer, ChevronLeft, Package, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function LabelPrintView({ date }: { date: Date }) {
    const [data, setData] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [date]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [workloadResult, settingsResult] = await Promise.all([
                getKitchenWorkload(date),
                getSystemSettings()
            ]);
            setData(workloadResult);
            setSettings(settingsResult);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="text-center py-20">라벨 데이터를 생성하는 중...</div>;
    if (!data) return <div className="text-center py-20">데이터가 없습니다.</div>;

    const { orders, menu } = data;

    // 모든 주문을 개별 라벨 단위로 펼치기
    const allLabels: any[] = [];
    orders.forEach((o: any) => {
        // 도시락 라벨
        for (let i = 0; i < o.lunchboxCount; i++) {
            allLabels.push({
                type: 'LUNCHBOX',
                clientName: o.clientName,
                menuName: menu?.lunchbox?.main || '데일리 도시락',
                date: date
            });
        }
        // 샐러드 라벨
        for (let i = 0; i < o.saladCount; i++) {
            allLabels.push({
                type: 'SALAD',
                clientName: o.clientName,
                menuName: '신선 원플레이트 샐러드',
                date: date
            });
        }
    });

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Controls */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href={`/admin/lunch/work?date=${format(date, 'yyyy-MM-dd')}`}>
                        <Button variant="ghost" size="icon"><ChevronLeft /></Button>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Package className="h-6 w-6 text-blue-500" />
                        스티커 라벨 출력
                    </h1>
                    <Badge variant="secondary">총 {allLabels.length}장</Badge>
                </div>
                <Button variant="default" className="gap-2 bg-blue-600" onClick={handlePrint}>
                    <Printer className="h-4 w-4" /> 라벨 인쇄 (A4)
                </Button>
            </div>

            {/* Label Layout (A4 Preview) */}
            <div className="bg-slate-100 p-8 min-h-screen flex justify-center print:bg-white print:p-0">
                <div className="bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[10mm] grid grid-cols-3 gap-[2mm] content-start print:shadow-none print:w-full print:p-[5mm]">
                    {allLabels.map((label, idx) => (
                        <div key={idx} className="border-2 border-slate-200 rounded-lg p-3 h-[40mm] flex flex-col justify-between relative overflow-hidden group hover:border-blue-400 transition-colors">
                            {/* Type Indicator */}
                            <div className={cn(
                                "absolute top-0 right-0 px-2 py-0.5 text-[8px] font-black uppercase text-white rounded-bl-md shadow-sm",
                                label.type === 'LUNCHBOX' ? "bg-orange-500" : "bg-green-600"
                            )}>
                                {label.type}
                            </div>

                            <div className="space-y-1">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Catering Service</div>
                                <div className="text-sm font-black text-slate-900 line-clamp-1">{label.clientName}</div>
                            </div>

                            <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                                <div className="text-[11px] font-black text-blue-700 leading-tight mb-0.5">{label.menuName}</div>
                                <div className="text-[8px] text-slate-400 font-medium">Enjoy your meal!</div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="text-[9px] font-bold text-slate-400">
                                    {format(label.date, 'MM/dd')} 조리
                                </div>
                                <div className="text-[10px] font-black tracking-tighter italic text-red-500/30 uppercase">
                                    {settings?.companyName || 'PHILMONG'}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty Slots to maintain grid if needed (Optional) */}
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                    }
                    header, footer, nav, .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

// Simple CN replacement since utils might not be perfect
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
